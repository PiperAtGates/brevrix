---
title: "Redis Memory Keeps Growing? How to Diagnose What Is Actually Eating It"
description: "Redis memory usage growing? Diagnose the real cause: used_memory vs RSS, --bigkeys and --memkeys, keys without TTLs, output buffers, maxmemory policy."
aiSummary: "Redis memory growth has a small set of usual causes, and the first job is telling them apart: check used_memory against used_memory_rss and mem_fragmentation_ratio in INFO memory, then hunt the data with --bigkeys, --memkeys and MEMORY USAGE. The common root causes are keys written without TTLs, one unbounded collection, client output buffers from stalled consumers, replication buffers, and persistence fork overhead. Fix the cause, then set maxmemory and an eviction policy that matches the workload — cache or primary store — and alert on growth rate, not just the absolute number."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "Databases"
---

The alert says Redis is at 90% memory. Someone suggests restarting it. That is the worst first move available: a restart throws away the evidence and empties the cache. If the growth comes from your own application's write pattern, it also buys you exactly as long as it takes that pattern to refill it.

Redis memory problems are diagnosable, and the diagnosis is fast if you work in the right order. This playbook follows the order we use on production incidents: first establish *what kind* of memory is growing, then find *which data* it is, then match it to a root cause. Almost every case lands in one of a handful of buckets.

## Step 1: Establish what is actually growing

"Redis is using 8 GB" can mean three different things, and they have different fixes:

- **Real data growth**: the dataset itself is bigger. Keys accumulated, a collection grew, values got larger.
- **Fragmentation**: Redis freed memory internally, but the allocator has not returned it to the OS, or the resident pages are scattered. The process *resident* size is high; the data is not.
- **Non-data memory**: buffers, replication backlog, persistence forks, and Lua/module overhead. The data is fine; something attached to it is not.

Start with `INFO memory`:

```bash
redis-cli INFO memory
```

The fields that matter:

```text
used_memory_human:6.24G        # memory Redis has allocated for data + overhead
used_memory_rss_human:8.91G    # resident set size the OS sees
mem_fragmentation_ratio:1.43   # rss / used_memory
used_memory_peak_human:7.02G   # high-water mark since start
maxmemory_human:0B             # 0 = no limit set
```

Read them together:

- `used_memory` climbing steadily: the dataset or Redis-internal structures are growing. Go to Step 2.
- `used_memory` flat but `used_memory_rss` high, with `mem_fragmentation_ratio` well above ~1.5: fragmentation or a recent fork. Check `INFO persistence` for `rdb_bgsave_in_progress` / `aof_rewrite_in_progress`, and remember RSS also spikes *during* a BGSAVE or AOF rewrite because the forked child shares pages until it writes to them (copy-on-write). A ratio that stays high *after* persistence finishes, on a workload with heavy deletes, points at the allocator. Turn on the built-in active defragmentation (`CONFIG SET activedefrag yes`) rather than restarting.
- Both flat but the *host* is out of memory: look outside the dataset, at `INFO clients` and `INFO replication`, covered in the root causes below.

Two counters in `INFO stats` complete the picture:

```bash
redis-cli INFO stats | grep -E 'expired_keys|evicted_keys|keyspace_hits|keyspace_misses'
```

- `expired_keys` rising means TTLs exist and are firing. Good.
- `evicted_keys` rising means you have a `maxmemory` limit and Redis is already evicting to stay under it. Memory is "growing" to the cap *by design*; the question becomes whether the working set fits.
- `evicted_keys` at 0, `maxmemory` at 0, memory climbing: nothing is bounding growth. That is the most common configuration we find behind these incidents, and it means the dataset itself is the problem until proven otherwise.

## Step 2: Find the big data

With data growth confirmed, locate it. Never start with `KEYS *`. It scans the entire keyspace in one blocking call on the main thread, and on a loaded production instance that is how a memory investigation becomes an outage. Everything below is incremental.

### Per-database totals

```bash
redis-cli INFO keyspace
```

```text
db0:keys=1842031,expires=1204883,avg_ttl=86412033
db3:keys=412,expires=0,avg_ttl=0
```

This alone solves a surprising number of cases: one logical database with millions of keys and *zero* expires is a cache or session store that never expires anything. Note the `expires` count per DB: keys with a TTL vs total keys is the fastest smell test in Redis.

### Biggest keys by type

```bash
redis-cli --bigkeys
redis-cli --memkeys
```

`--bigkeys` samples the keyspace and reports the largest key per type (most elements for collections). `--memkeys` does the same by actual memory footprint, which is usually the one you want: a string key holding a 40 MB serialized blob can outweigh a hash with ten thousand small fields. Both use `SCAN` under the hood, so they are safe to run in production, though on very large keyspaces they take a while.

### Confirm with MEMORY USAGE and sample by pattern

Take the suspects and measure them directly:

```bash
redis-cli MEMORY USAGE session:9f31c2
redis-cli LLEN jobs:pending        # list length
redis-cli HLEN user:4417:profile   # hash field count
redis-cli ZCARD leaderboard:global # sorted set members
redis-cli SCARD followers:88213    # set members
```

Then sample by key *pattern* to see which namespace is accumulating. Use `SCAN` with a cursor, in small counts:

```bash
redis-cli --scan --pattern 'cache:product:*' | head -50
redis-cli --scan --pattern 'session:*' | wc -l
```

Counting per prefix across a few samples usually reveals the shape of the problem: one prefix dominating, timestamps or user IDs embedded in keys that were supposed to be transient, or a "temporary" namespace from a feature that shipped months ago.

## Step 3: Match it to a root cause

### Keys written without TTLs

The single most common cause. A developer writes session or cache data with `SET` and no `EXPIRE`, or a library upgrade changes a default, and keys accumulate forever. The signal: keyspace shows a large gap between `keys` and `expires`, and TTL sampling confirms it:

```bash
redis-cli --scan --pattern 'session:*' | head -100 | \
  while read k; do echo "$k $(redis-cli TTL "$k")"; done
```

A `TTL` of `-1` means the key exists with no expiry. Sample a few hundred keys per prefix; if most return `-1` in a namespace that is conceptually temporary, you have found it. The fix is in the application (set expiry at write time), plus a one-off cleanup that expires the backlog: set TTLs on the existing keys in batches via `SCAN` instead of deleting them all at once and stampeding your database with a cold cache.

### One giant collection

The opposite shape: key count is modest, but a single hash, list, sorted set, or stream holds millions of elements. Signals: `--bigkeys` flags one key far above the rest; `MEMORY USAGE` on it returns gigabytes. Typical offenders: an audit or events list that is only ever `LPUSH`ed and never trimmed, a sorted set used as an unbounded log, a stream with no `MAXLEN`. Fixes are structural: cap lists with `LTRIM`, cap streams with `XADD ... MAXLEN ~`, shard the collection by time or tenant (`events:2026-11` instead of `events`), and add the cap in the writing code, not as a cron job that fights the writer.

### Client output buffers: the stalled consumer

A Pub/Sub subscriber or a replica-like consumer that stops reading does not disconnect politely; Redis keeps buffering messages for it, and the buffer is memory that appears in no keyspace statistic. Check:

```bash
redis-cli INFO clients
redis-cli CLIENT LIST
```

Look at `connected_clients`, and in `CLIENT LIST` output, the `omem` field (output buffer memory) per client. One client with a huge `omem`, usually a subscriber on a busy channel or a client issuing large `LRANGE`/`SMEMBERS` replies on a slow network, is your growth. Redis has limits for this (`client-output-buffer-limit pubsub 32mb 8mb 60` is the shipped default class for Pub/Sub); a client that was exempted or a limit raised "temporarily" and forgotten is a classic. Fix the consumer, and restore sane buffer limits.

### Replication buffers and backlog

On a primary with replicas, memory includes the replication backlog and per-replica buffers. A replica that falls behind, because of a network issue or because it is busy loading an RDB, causes the primary to hold more output for it. Check `INFO replication`: `master_repl_offset` vs each replica's offset, and the backlog size (`repl_backlog_size`). A backlog sized generously for safety plus several lagging replicas adds up. Fix the replica's lag instead of shrinking the backlog blindly. Too small a backlog forces full resyncs, which cost far more memory via fork.

### Persistence overhead: forks and AOF growth

Two persistence effects get misread as data growth:

- **Copy-on-write during BGSAVE/AOF rewrite:** while the child writes the snapshot, every page the parent modifies is duplicated. On a write-heavy instance, RSS can climb sharply for the duration of the fork and fall back after. Correlate with `INFO persistence` timestamps before concluding anything.
- **AOF growth between rewrites:** the append-only file grows with write volume until `auto-aof-rewrite-percentage` triggers a rewrite. That is disk, not memory. An AOF rewrite *in progress* is memory, though (see above), and a rewrite that keeps failing leaves both problems in place. Check `aof_last_bgrewrite_status`.

### Lua scripts and modules

Cached Lua scripts are small; this is rarely the cause. It becomes relevant with modules (RedisJSON, RediSearch) where indexes and documents carry overhead that `MEMORY USAGE` on individual keys understates, and with scripts that build large in-memory results. If you run modules, check their own `INFO` sections (`INFO modules`) before assuming the core numbers tell the whole story.

## Step 4: Bound it: maxmemory and eviction policy

Diagnosis first, then the seatbelt. Setting `maxmemory` without knowing *why* memory grows just converts "Redis OOMs the host" into "Redis silently evicts or refuses writes." The incident moves; it does not end. Once the cause is fixed, set the bound deliberately:

```bash
redis-cli CONFIG SET maxmemory 10gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

Persist both in `redis.conf`. `CONFIG SET` alone does not survive a restart.

Choosing the policy is a workload question:

- **Redis as a cache** (the data exists elsewhere): `allkeys-lru` or, usually better, `allkeys-lfu`. LFU tracks access frequency, so a burst of one-time scans does not flush your genuinely hot keys the way pure recency can. Eviction here is normal operation, not data loss.
- **Redis as a primary datastore** (queues, sessions you cannot lose, anything without another source of truth): `noeviction`. Redis returns errors on writes at the limit instead of deleting your data. This is the correct default for a store, and it makes the alerting below non-optional, because the failure mode is write errors.
- **`volatile-*` policies** only evict keys that have TTLs. They are the right choice for a mixed instance (durable keys + expirable cache in one place) and a trap everywhere else: if the TTL'd keys are not enough to free space, a `volatile` policy behaves like `noeviction` and writes start failing while gigabytes sit in non-expiring keys.

Size `maxmemory` with headroom: leave room for fragmentation, replication buffers, and fork copy-on-write. Setting it to 100% of the container or host limit guarantees the OOM killer gets a vote during the next BGSAVE.

## Step 5: Monitor so it does not recur

A memory incident you have fixed once will recur if the only signal is "the host ran out." Monitor three things:

1. **Growth rate, not just level.** Sample `used_memory` (via `redis_exporter` for Prometheus, or a cron'd `INFO` snapshot) and alert on sustained slope: "grew 15% in 24h with flat traffic" is the early warning that a TTL stopped being set in the last deploy. Absolute thresholds only fire when it is already late.
2. **The ratio and the counters.** Alert on `mem_fragmentation_ratio` staying above ~1.5 outside persistence windows, and on `evicted_keys` increasing at all on an instance whose policy assumes it should not evict.
3. **Keyspace shape.** A periodic `--bigkeys` sample or per-prefix key count in cron is cheap insurance; the day one collection starts doubling weekly, you want a graph, not a page.

## Common mistakes

- **Restarting Redis as the fix.** It discards the counters and the dataset that would have told you the cause, and if the cause is an application write pattern, the growth restarts immediately, now with a cold cache hammering your database on top.
- **Deleting by pattern with `KEYS`.** `KEYS 'session:*'` blocks the main thread for the whole scan. On the loaded, memory-pressured instance you are trying to save, that stall can be the outage. `SCAN` in batches, always.
- **Blaming fragmentation by default.** A high RSS is a symptom with at least three causes (fragmentation, forks, buffers). The ratio plus `INFO persistence` and `INFO clients` distinguishes them in two minutes; guessing wastes the incident.
- **Setting `maxmemory` and walking away.** Without an eviction policy matched to the workload and an alert on growth rate, the limit just changes which failure you get.

## FAQ

### Why does the OS report more memory than `used_memory`?

Because `used_memory_rss` includes fragmented pages the allocator has not returned, copy-on-write pages during persistence forks, and buffers. A ratio (`mem_fragmentation_ratio`) around 1.0 to 1.5 is normal; sustained values well above that, outside a fork window, are worth investigating with the steps above.

### Is a high `mem_fragmentation_ratio` always a problem?

No. It is expected during and shortly after BGSAVE or AOF rewrites, and on workloads with many expirations. It is a problem when it stays high, keeps climbing, and the host or container limit is close enough that the gap between RSS and the limit disappears.

### Should every key have a TTL?

No. Durable data should not expire. Every *category* of key should have a deliberate answer, though: this namespace expires, this one is capped, this one is durable and monitored. Incidents come from namespaces nobody made a decision about.

### We set `maxmemory` and now writes are failing. What happened?

Your policy is `noeviction` (or a `volatile-*` policy with too few expirable keys), and the dataset reached the limit. That is the policy working as configured. Free space by fixing the growth cause or expiring the right backlog. If this instance is a cache, switch to `allkeys-lfu` so Redis can evict instead of refusing.

## The short version

Read `INFO memory` before touching anything: `used_memory` vs RSS vs the fragmentation ratio tells you whether you are hunting data, buffers, or the allocator. Find the data with `--bigkeys`, `--memkeys`, `MEMORY USAGE`, and `SCAN`, never `KEYS`. Expect one of five causes: missing TTLs, one unbounded collection, a stalled consumer's output buffer, replication lag, or persistence fork overhead. Fix that, then set `maxmemory` with a policy that matches whether Redis is a cache or a store, and alert on growth rate so the next leak is a graph anomaly, not an outage.

If Redis is one piece of a database setup you would rather have run properly, with sizing, persistence, backups, and monitoring included, that is exactly what our [database operations service](/services/database-operations/) covers, on servers we also keep hardened and patched through [Linux server management](/services/linux-server-management/). Or [get in touch](/contact/) and describe what your instance is doing.
