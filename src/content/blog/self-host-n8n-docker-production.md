---
title: "Self-Hosting n8n on Docker: A Production Setup, Not a Toy Compose File"
description: "Self-host n8n on Docker for production: PostgreSQL instead of SQLite, a TLS reverse proxy, execution pruning, encryption-key backups, and safe upgrades."
aiSummary: "The default n8n Docker quick-start is a demo, not a production setup: it uses SQLite, never prunes execution data, exposes webhooks without a proxy or TLS, and leaves the credential encryption key unprotected. A production self-hosted n8n needs PostgreSQL, a reverse proxy with automatic TLS and correct WEBHOOK_URL settings, execution-data pruning, separate backups of the database and the N8N_ENCRYPTION_KEY, pinned image versions, and a tested upgrade procedure."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "AI & Automation"
faq:
  - question: "Can I migrate an existing SQLite instance to PostgreSQL later?"
    answer: "Yes. n8n provides export and import commands for workflows and credentials, and the documented path is to export from the old instance, start the new one on PostgreSQL with the same encryption key, and import. It is far easier to start on PostgreSQL, which is why the production compose file does."
  - question: "Does n8n need Redis or queue mode to be \"production\"?"
    answer: "Not at small scale. Queue mode with workers is for high execution volume and horizontal scaling. A single instance on PostgreSQL, pruned and backed up, is a legitimate production setup for most small teams; add queue mode when you can point at the load that requires it, not before."
  - question: "How much disk should I plan for execution data?"
    answer: "It depends entirely on payload size and workflow frequency, which is exactly why pruning with a retention window matters more than the initial disk size. Set EXECUTIONS_DATA_MAX_AGE, watch volume growth for the first few weeks, and size from your own data."
  - question: "Is the free self-hosted version enough, or do I need a paid licence?"
    answer: "For core workflow automation, the self-hosted Community edition covers most small-team needs. Paid tiers add features such as advanced collaboration, SSO, and extended execution-data tooling. Evaluate against the specific feature list when a concrete need appears, rather than paying pre-emptively or assuming a needed feature is free."
---

The official n8n quick-start gets you a running editor in minutes, and for trying the tool out that is exactly what it should do. The problem is that the same compose file ends up as the production deployment: the demo that never got replaced. When that happens, the setup is wrong in five specific ways:

1. **SQLite is the default database.** Fine for one person testing workflows. Under real webhook traffic and scheduled executions, a single-file database becomes the bottleneck and the corruption risk.
2. **Execution data is kept forever.** Every execution stores its full payload by default. The database grows without bound until the disk fills. A full disk takes down n8n and everything else on the host.
3. **The editor and webhooks are exposed directly**, usually over plain HTTP on port 5678, with no reverse proxy and no TLS. Anyone who can reach the port can reach your automation control panel.
4. **The encryption key is not backed up.** n8n encrypts stored credentials with a key generated on first start. Lose the key (a rebuilt container, a lost volume) and every credential in the database is unreadable, even if the database itself survives.
5. **One container, pinned to nothing.** `latest` as the image tag, no restart policy, no separation between the app and its data. You cannot scale it, and you cannot reproduce it.

This post builds the version we would actually put in production: n8n on PostgreSQL, behind a TLS-terminating reverse proxy, with pruning configured, the encryption key treated as the secret it is, and an upgrade procedure that does not involve hope. If you are still deciding whether to self-host at all, the honest comparison with n8n Cloud is at the end.

## The production compose file

Two services: n8n itself, and PostgreSQL as its database. Secrets live in a `.env` file that is never committed to Git. Image versions are pinned. Change them deliberately, during an upgrade, not by accident on a rebuild.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  n8n:
    image: docker.n8n.io/n8nio/n8n:1.68.2
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
      DB_POSTGRESDB_USER: ${POSTGRES_USER}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_HOST: ${N8N_HOST}
      N8N_PORT: 5678
      N8N_PROTOCOL: https
      WEBHOOK_URL: https://${N8N_HOST}/
      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: 336
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE}
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  postgres_data:
  n8n_data:
```

And the `.env` file beside it (placeholders: replace every value, then store a copy in your password manager, not in the repo):

```bash
POSTGRES_USER=n8n
POSTGRES_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_PASSWORD
POSTGRES_DB=n8n
N8N_ENCRYPTION_KEY=REPLACE_WITH_A_LONG_RANDOM_STRING
N8N_HOST=n8n.example.com
GENERIC_TIMEZONE=Asia/Dhaka
```

Three details in this file do most of the work:

- **`DB_TYPE: postgresdb`** switches n8n off SQLite. PostgreSQL handles concurrent executions, gives you real backup tooling (`pg_dump`), and removes the single-file failure mode entirely. The `DB_POSTGRESDB_*` variables point n8n at the compose service by name, with no host networking and no exposed database port.
- **The port binding is `127.0.0.1:5678`.** n8n is reachable only from the host itself, which means the reverse proxy in the next section is the *only* way in from the network. PostgreSQL publishes no port at all.
- **`depends_on` with `service_healthy`** stops n8n from crash-looping against a database that is still starting. Small thing, but it is the difference between a clean boot after a host reboot and a page full of connection errors.

The `n8n_data` volume still matters with PostgreSQL in place: it holds local files, binary data stored on disk, and configuration. Back it up as well; see the backup section.

## Put a reverse proxy with TLS in front

n8n's editor holds the keys to every connected service, and its webhook endpoints are public URLs that external systems call. Both need HTTPS. The simplest production-grade option is Caddy, which obtains and renews Let's Encrypt certificates automatically:

```caddy
n8n.example.com {
    reverse_proxy 127.0.0.1:5678
}
```

That is the whole Caddyfile. Point the DNS record at the host, start Caddy, and TLS works, including issuance, renewal, and the HTTP-to-HTTPS redirect. Traefik achieves the same with labels on the n8n service and a certificate resolver; use whichever your stack already runs, but do not run n8n bare on port 5678 and call it done. If the host itself needs hardening first (firewall, SSH keys, automatic updates), work through our [Linux server hardening checklist](/blog/linux-server-hardening-checklist/) before exposing anything on it.

The proxy is also why three environment variables in the compose file matter:

- **`N8N_HOST`**: the public hostname, without scheme or port.
- **`N8N_PROTOCOL: https`**: because TLS terminates at the proxy, n8n itself speaks HTTP internally; this tells it the public scheme.
- **`WEBHOOK_URL`**: the base URL n8n uses to build webhook URLs shown in the editor and sent to external services.

Get `WEBHOOK_URL` wrong and everything *looks* fine in the editor while every production webhook points at `localhost` or plain HTTP, the classic self-hosting bug that surfaces only when a real integration fails to call back. Set it explicitly, as above, rather than trusting defaults.

## The encryption key is the whole deployment

n8n stores credentials (API tokens, OAuth tokens, database passwords for every connected system) encrypted in its database with `N8N_ENCRYPTION_KEY`. On first start without one set, n8n generates a key and stores it in the `n8n_data` volume. Two consequences follow:

- **If the key is lost, the credentials are gone.** The encrypted values in a perfectly intact database backup are useless without the exact key that encrypted them. Restoring the database alone does not restore your workflows' connections.
- **The key must be backed up separately from the database.** A backup strategy that dumps PostgreSQL but not the key is a strategy for restoring an empty shell.

Setting the key explicitly in `.env`, as the compose file above does, makes it a known, managed secret: store it in your password manager or secrets store, keep it out of Git, and include it in whatever off-box backup routine you run. Treat it with the same care as the database backup itself. Anyone with both the database and the key has every credential your workflows use.

## Stop the database eating the disk: execution pruning

Every workflow execution stores its input and output data so you can inspect and debug it. That is genuinely useful, for a while. Left at defaults, successful executions are saved indefinitely, and a busy instance accumulates payload data until PostgreSQL fills the volume. This is the most common way self-hosted n8n dies, and the cause is plain arithmetic.

The compose file sets the two controls that matter:

```yaml
EXECUTIONS_DATA_PRUNE: "true"
EXECUTIONS_DATA_MAX_AGE: 336
```

`EXECUTIONS_DATA_MAX_AGE` is in hours; 336 is 14 days of retained execution history, a reasonable starting point for most production workflows. Tune it to your debugging habits, not to zero. When a workflow misbehaves at 3 a.m., recent execution data is how you find out why.

Two related settings deserve a decision per workflow rather than globally. In each workflow's settings you can control whether execution data is saved at all; for high-frequency, low-value workflows (a webhook that fires every minute and does something trivial), saving only errors keeps the signal and drops the noise. And for workflows that move files, look at binary data handling: storing large binaries in the database bloats it fast, while filesystem mode keeps them in the `n8n_data` volume where they are cheaper to store and to back up.

## Backups and upgrades

### Back up three things

1. **The database:** `pg_dump` from the postgres container, on a schedule, copied off the host:

```bash
docker compose exec -T postgres pg_dump -U n8n n8n > n8n-db-$(date +%F).sql
```

2. **The `n8n_data` volume**: local files and on-disk binary data.
3. **The `.env` file, including `N8N_ENCRYPTION_KEY`**: stored separately from the other two, in your password manager or secrets store.

Then test a restore once. An untested backup is a hypothesis.

### Upgrade deliberately

Because the image version is pinned, upgrading is a controlled event instead of something that happens to you on a rebuild:

1. Take a fresh database backup (command above).
2. Read the release notes for the target version. n8n flags breaking changes explicitly, especially around nodes and execution behaviour.
3. Change the pinned tag in the compose file to the new version.
4. `docker compose pull && docker compose up -d`, then check the editor loads, credentials still decrypt (this is where a missing encryption key would announce itself), and a test webhook fires.

If the upgrade goes wrong, the path back is the old tag plus the backup, which only works because both exist. Never upgrade by switching to `latest` and pulling; you lose the ability to say which version you were running, which is the first question every debugging session asks.

### Accounts: close the front door properly

On first start, n8n asks you to create the owner account. Do that immediately. An unclaimed instance on a public URL is an open invitation, because whoever creates the first account owns the instance. Once the owner exists, public self-registration is off by default for new user creation; additional users join by invitation. Keep it that way: every account on the instance can see and run workflows with production credentials, so accounts are an admin decision, not a signup form.

## Sizing

For a small team's production instance (dozens of workflows, webhook and schedule triggers, no heavy data processing inside n8n itself), a starting point of 2 vCPU and 2 to 4 GB RAM on the host is workable, with PostgreSQL on the same box as in the compose file above. File-heavy workflows, large payloads, or code nodes doing real computation push requirements up; watch memory during your busiest workflows and size from what you observe. These are starting points for a first deployment, not guarantees. Your workflows decide.

## When self-hosting stops making sense

Self-hosting buys you data control, no per-execution pricing, and the ability to reach internal systems that a cloud service cannot. It costs you the operations: patching the host, renewing nothing (Caddy handles TLS) but monitoring everything, owning every outage, and being the person paged when the disk fills at night despite the pruning settings.

n8n Cloud removes that operational load and adds its own constraints: cost scales with usage, and workflows that need to reach your internal network get harder. Self-host when data control or internal access requires it, or when execution volume makes cloud pricing the bigger problem, and only when you have someone who will actually maintain the box. If nobody owns the maintenance, the toy compose file is not the risk; the abandoned production one is. This is the same trade-off we walk clients through on [automation projects](/services/ai-automation/): the tooling is rarely the hard part; the operating discipline is.

## Common mistakes

- **Exposing the editor without TLS.** Port 5678 open to the internet over HTTP sends your session and credentials in cleartext and advertises an automation control panel to every scanner.
- **Staying on SQLite under real load.** It survives the demo and degrades exactly when the workflows start mattering.
- **Never enabling pruning.** The disk fills on a long enough timeline, every time.
- **Backing up the database but not the encryption key.** A restore that cannot decrypt any credential is not a restore.
- **Running `latest`.** Unpinned images make every rebuild an unplanned upgrade with no rollback story.

## FAQ

### Can I migrate an existing SQLite instance to PostgreSQL later?

Yes. n8n provides export and import commands for workflows and credentials, and the documented path is to export from the old instance, start the new one on PostgreSQL with the *same* encryption key, and import. It is far easier to start on PostgreSQL, which is why the production compose file does.

### Does n8n need Redis or queue mode to be "production"?

Not at small scale. Queue mode with workers is for high execution volume and horizontal scaling. A single instance on PostgreSQL, pruned and backed up, is a legitimate production setup for most small teams; add queue mode when you can point at the load that requires it, not before.

### How much disk should I plan for execution data?

It depends entirely on payload size and workflow frequency, which is exactly why pruning with a retention window matters more than the initial disk size. Set `EXECUTIONS_DATA_MAX_AGE`, watch volume growth for the first few weeks, and size from your own data.

### Is the free self-hosted version enough, or do I need a paid licence?

For core workflow automation, the self-hosted Community edition covers most small-team needs. Paid tiers add features such as advanced collaboration, SSO, and extended execution-data tooling. Evaluate against the specific feature list when a concrete need appears, rather than paying pre-emptively or assuming a needed feature is free.

## The short version

PostgreSQL instead of SQLite, a proxy with real TLS in front, `WEBHOOK_URL` set correctly, execution pruning on, the encryption key backed up separately from the database, pinned versions, and an upgrade procedure you have rehearsed. That is the whole difference between the demo compose file and a production one. None of it is exotic, and all of it is cheaper to do now than after the first incident.

Building automation you intend to rely on, whether that is self-hosted n8n or workflows on top of it, is part of our [AI automation service](/services/ai-automation/). If you would rather have the setup, hardening, and maintenance handled, [get in touch](/contact/) and describe what you are automating.
