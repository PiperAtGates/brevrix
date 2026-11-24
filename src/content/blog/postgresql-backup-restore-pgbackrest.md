---
title: "PostgreSQL Backup and Restore with pgBackRest: A Practical Setup Guide"
description: "PostgreSQL backup with pgBackRest: full, differential and incremental backups, WAL archiving, point-in-time recovery and tested restores, step by step."
aiSummary: "pg_dump is a logical export, not a backup strategy: it has no point-in-time recovery, no incremental mode, and restores get slower as the database grows. pgBackRest adds physical full, differential and incremental backups, continuous WAL archiving for point-in-time recovery, parallel backup and restore, and multiple repositories including S3-compatible storage. This guide sets it up on Debian/Ubuntu with PostgreSQL 15 or 16, then covers the part most guides skip: restoring, including a PITR example and a test restore on a different server."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "Databases"
faq:
  - question: "Can pgBackRest use only S3, with no local repository?"
    answer: "Yes. A single S3 repository is a valid configuration, and many small setups run exactly that. The local repo in this guide earns its place on restore speed and on having a copy that does not depend on network or a cloud account being reachable during an incident. If you keep one repo, keep the off-server one."
  - question: "Should I stop using pg_dump entirely?"
    answer: "No. PITR restores a whole cluster to a point in time; it cannot hand you one table as SQL. Keep an occasional pg_dump for portability: major-version upgrades, moving a single database to another system, long-term archival in a format you can read without pgBackRest. The two tools answer different questions."
  - question: "Differential or incremental for the daily job?"
    answer: "Differential backups grow through the week (each one contains everything since Sunday's full) but restore needs only the full plus the latest differential. Incrementals stay small but restore replays the whole chain. For most databases the differential's simpler, shorter restore wins; switch to incremental when the daily differential's size becomes a real storage or time problem."
  - question: "What if I need one table back, not the whole cluster?"
    answer: "Restore the cluster to a scratch server using the PITR procedure above, then extract the table with pg_dump -t or a COPY from the scratch instance and load it into production. This is slower than a logical backup of that table would have been, which is exactly why the previous answer keeps pg_dump in the toolkit."
---

`pg_dump` is the first backup tool every PostgreSQL user learns, and for a small database it is genuinely fine. It stops being fine quietly. There is no point-in-time recovery: you get the database as it was when the dump started, and everything after that is gone. There is no incremental mode: a large database is copied in full every night. And the restore is a replay of SQL statements, so recovery time grows with the data. The biggest databases are the slowest to get back.

pgBackRest takes a different approach. It makes physical backups of the cluster: full, differential (everything changed since the last full), and incremental (everything changed since the last backup of any type). Between backups it archives WAL continuously, which is what makes point-in-time recovery (PITR) possible. You restore a base backup, replay WAL up to a timestamp you choose, and stop *before* the bad `DELETE` instead of after the last dump. Backups and restores run in parallel across multiple processes, and the repository can be a local disk, a remote host, S3 or S3-compatible object storage, or several of those at once.

This guide builds a complete setup on Debian/Ubuntu with PostgreSQL 15 or 16: a local repository plus an S3 repository, WAL archiving, a weekly-full/daily-differential schedule, and then the restore procedures, because none of the backup side counts until a restore has actually worked. The same off-box principle from our [Linux server hardening checklist](/blog/linux-server-hardening-checklist/) applies here too, with higher stakes: the database is usually the one thing on the server that cannot be rebuilt from code.

## Install and lay out the repositories

pgBackRest is packaged for Debian and Ubuntu (the PGDG apt repository carries current versions):

```bash
sudo apt update
sudo apt install pgbackrest
sudo install -d -o postgres -g postgres -m 0750 /var/lib/pgbackrest
sudo install -d -o postgres -g postgres -m 0750 /var/log/pgbackrest
```

Create `/etc/pgbackrest/pgbackrest.conf`. This configuration keeps two repositories: `repo1` on a local disk (fast restores for the common cases) and `repo2` in S3-compatible object storage (survives losing the server entirely). Replace every value in capitals with your own. They are placeholders, not working credentials.

```ini
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=2

repo2-type=s3
repo2-s3-bucket=YOUR-BUCKET-NAME
repo2-s3-endpoint=YOUR-S3-ENDPOINT
repo2-s3-region=YOUR-REGION
repo2-s3-key=YOUR-ACCESS-KEY
repo2-s3-key-secret=YOUR-SECRET-KEY
repo2-path=/pgbackrest
repo2-retention-full=4

process-max=2
log-level-console=info

[main]
pg1-path=/var/lib/postgresql/16/main
```

Notes that matter:

- Retention is per repository. Two full backups locally and four in object storage is a reasonable starting point. PITR reach is determined by your oldest retained full backup plus unbroken WAL from it (more on that under mistakes).
- `pg1-path` must match your cluster's data directory. `/var/lib/postgresql/16/main` is the Debian/Ubuntu package layout for PostgreSQL 16; use `15` for PostgreSQL 15, or check with `pg_lsclusters`.
- The config file now contains a secret. Restrict it before you do anything else:

```bash
sudo chown root:postgres /etc/pgbackrest/pgbackrest.conf
sudo chmod 0640 /etc/pgbackrest/pgbackrest.conf
```

## Turn on WAL archiving

pgBackRest's backups need PostgreSQL to hand it every completed WAL segment. In `postgresql.conf` (or via `ALTER SYSTEM`):

```ini
archive_mode = on
archive_command = 'pgbackrest --stanza=main archive-push %p'
wal_level = replica
max_wal_senders = 3
```

`wal_level = replica` is already the default on modern PostgreSQL, but set it explicitly so a future config cleanup does not remove it by accident. PITR depends on WAL containing enough information to replay. `max_wal_senders` is not used by file-based archiving itself, but leaving room costs nothing and you will want it the day you add a standby or logical replication.

Restart PostgreSQL (archive_mode requires a restart, not a reload), then create the stanza, pgBackRest's record of this cluster in the repositories, and run its self-check:

```bash
sudo systemctl restart postgresql
sudo -u postgres pgbackrest --stanza=main stanza-create
sudo -u postgres pgbackrest --stanza=main check
```

`check` is the step people skip and regret. It verifies that PostgreSQL can archive WAL to *every* configured repository and that pgBackRest can read it back. If it fails here, it fails with a readable error on a calm afternoon instead of during an incident.

## Take the first backup and schedule the rest

```bash
sudo -u postgres pgbackrest --stanza=main --type=full backup
sudo -u postgres pgbackrest --stanza=main info
```

`info` shows the stanza, each backup with its type and time range, and the WAL archive range each backup spans. Get used to reading it. It is the fastest way to answer "what could we actually restore right now?"

For the schedule, the pattern that fits most production databases is a weekly full backup with a differential on the other days. As cron entries for the `postgres` user:

```cron
# /etc/cron.d/pgbackrest
0 2 * * 0 postgres /usr/bin/pgbackrest --stanza=main --type=full backup
0 2 * * 1-6 postgres /usr/bin/pgbackrest --stanza=main --type=diff backup
```

A systemd timer running the same two commands is equally good. Pick whichever your team already uses for scheduled jobs. What matters is that failures get seen. Route the output somewhere a human looks, and alert on the absence of a recent successful backup as well as on error messages (verification, below).

## Restore: the part that decides whether any of this worked

### Plain restore, latest backup

The data directory pgBackRest restores into must be empty, and PostgreSQL must be stopped:

```bash
sudo systemctl stop postgresql
sudo -u postgres pgbackrest --stanza=main restore
sudo systemctl start postgresql
```

With no options, pgBackRest restores the most recent backup from the first repository that has it. Add `--repo=2` to restore from object storage instead, and `--type=immediate` if you only need the base backup without replaying archived WAL to the latest point.

### Faster in-place restore with --delta

By default the restore target must be an empty directory. pgBackRest refuses to write into a data directory that already has files, which is the right default when you are not sure what is in there. When you *are* sure (typically re-restoring the same cluster after a failed start, or refreshing a copy), add `--delta`:

```bash
sudo -u postgres pgbackrest --stanza=main --delta restore
```

Delta restore compares the existing files against the backup manifest and only restores what differs or is missing, deleting files that are not part of the backup. On a cluster where most of the data is unchanged, that is a much shorter path back than a full re-copy. Treat it with respect: it will remove files, so it belongs on a stopped cluster you have deliberately chosen to overwrite, never as a way to "top up" a running one.

### Point-in-time recovery

This is the scenario pgBackRest exists for: a bad change landed at a known time, and you want the database as it was just before it.

```bash
sudo systemctl stop postgresql
sudo -u postgres pgbackrest --stanza=main \
  --type=time --target="2026-11-24 10:30:00+06" \
  --target-action=promote restore
sudo systemctl start postgresql
```

pgBackRest restores the appropriate base backup and writes the recovery settings for you (into `postgresql.auto.conf` on PostgreSQL 12 and later). On startup, PostgreSQL replays archived WAL until it reaches the target time, then, because of `--target-action=promote`, opens for connections instead of pausing. Verify before you let traffic back in:

```sql
SELECT pg_is_in_recovery();  -- must return false after promotion
```

Then check the data itself: the table that was damaged should be in its pre-incident state, and a known write from after the target time should be absent. If either check surprises you, stop. You have restored to the wrong point, and finding that out now is much better than finding out after new writes land on top.

### Test restore on a different server

A restore drill on the production server proves little and risks much. Do it on a scratch server or VM instead: install PostgreSQL (same major version) and pgBackRest, copy the configuration (the scratch machine only needs read access to a repository, which is another argument for the S3 repo), and restore into an empty local directory:

```bash
sudo -u postgres pgbackrest --stanza=main \
  --pg1-path=/var/lib/postgresql/16/restore-test \
  --repo=2 restore
```

Point a PostgreSQL instance at that directory on a non-standard port, start it, and run real checks: row counts on your largest tables, a few application queries, `pg_is_in_recovery()`. A drill is not finished when the restore command exits 0. It is finished when the queries return the right answers.

## Verification discipline

- Read `pgbackrest info` weekly. It shows backup ages, types, and WAL ranges at a glance; anomalies (a missing diff, a WAL range that stops early) are visible before they matter.
- Watch the archiver, not just the backups. On the primary, `SELECT failed_count, last_archived_time FROM pg_stat_archiver;`. A rising `failed_count` means WAL is not reaching the repository and your PITR chain is breaking in real time.
- Alert on backup age. Whatever monitoring you run, it should fire when the newest full backup is older than your schedule says it should be. A backup job that goes quiet has usually failed, not succeeded.
- Drill restores on a schedule. Monthly is a sane cadence for most teams. After every PostgreSQL major upgrade and every pgBackRest config change, drill again regardless of the calendar.

## Common mistakes

- Never testing a restore. Backup jobs report success for months while the repository is corrupt, the credentials have expired, or the restore needs a flag nobody documented. The nightly job only makes copies; the drill is what proves the system works.
- WAL gaps. If `archive_command` fails for an afternoon (full disk, expired S3 key, network outage), that WAL is missing forever, and PITR cannot cross the gap. You can still restore the base backup; you cannot reach a target time on the other side of the hole. This is why archiver monitoring matters more than backup monitoring.
- Retention eating your recovery point. PITR needs a base backup taken *before* the target time plus continuous WAL from that backup forward. Aggressive retention that expires the last full backup before your required recovery window quietly deletes your ability to reach those times. Set retention from the recovery window you need, not from the storage you would like to save.
- World-readable configuration. `pgbackrest.conf` holds your object-storage keys. If it ships with default permissions, anyone or anything with local access can read the keys to the backups, which usually also means delete access to them.
- Repository on the same failure domain. A local-only repo on the same disk as the data protects against accidental `DROP TABLE` and nothing else. At least one repository must live somewhere the server's failure cannot reach.

## FAQ

### Can pgBackRest use only S3, with no local repository?

Yes. A single S3 repository is a valid configuration, and many small setups run exactly that. The local repo in this guide earns its place on restore speed and on having a copy that does not depend on network or a cloud account being reachable during an incident. If you keep one repo, keep the off-server one.

### Should I stop using pg_dump entirely?

No. PITR restores a whole cluster to a point in time; it cannot hand you one table as SQL. Keep an occasional `pg_dump` for portability: major-version upgrades, moving a single database to another system, long-term archival in a format you can read without pgBackRest. The two tools answer different questions.

### Differential or incremental for the daily job?

Differential backups grow through the week (each one contains everything since Sunday's full) but restore needs only the full plus the latest differential. Incrementals stay small but restore replays the whole chain. For most databases the differential's simpler, shorter restore wins; switch to incremental when the daily differential's size becomes a real storage or time problem.

### What if I need one table back, not the whole cluster?

Restore the cluster to a scratch server using the PITR procedure above, then extract the table with `pg_dump -t` or a `COPY` from the scratch instance and load it into production. This is slower than a logical backup of that table would have been, which is exactly why the previous answer keeps pg_dump in the toolkit.

## The short version

Install pgBackRest, archive WAL to at least one off-server repository, and take a weekly full with a daily differential. Then spend as much effort on restoring as you spent on backing up: `pgbackrest check` on day one, `pg_stat_archiver` watched from then on, and a PITR drill on a scratch server before you need one at 3 a.m. The setup above takes an afternoon. The restore discipline is the part that has to become a habit, and it is the part people skip.

This is the backup layer of our [database operations service](/services/database-operations/): pgBackRest setup, restore drills, and ongoing database care for PostgreSQL and Redis. If your current backup plan is a cron job and a hope, [get in touch](/contact/) and tell us what is at stake if it fails.
