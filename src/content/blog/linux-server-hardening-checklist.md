---
title: "Linux Server Hardening Checklist: 15 Steps for a Production VPS"
description: "Linux server hardening checklist: SSH keys, firewall, fail2ban, automatic security updates, sysctl, auditing — 15 steps with commands for Debian and Ubuntu."
aiSummary: "A production VPS should not go online with default settings. This checklist covers the 15 hardening steps that matter most on Debian and Ubuntu: key-only SSH with root login disabled, a default-deny firewall with fail2ban, automatic security updates, least-exposure services, basic sysctl settings, persistent logging with correct time sync, encrypted offsite backups, and verification with sshd -T, ss and Lynis instead of assuming the config took effect."
pubDate: 2026-11-24
author: "Sadia Afrin Lubna"
authorRole: "Founder & Principal Systems/DevOps Engineer"
category: "Linux & Servers"
---

A fresh VPS comes with defaults chosen for convenience. Automated scanners probe new IP addresses quickly and continuously, and a default install gives them plenty to work with: password-based SSH on port 22, root login enabled, no firewall, services listening that you never asked for, and no automatic patching. Most compromises of small servers are not sophisticated. They walk through doors that were left at factory settings.

This is the baseline we apply to Debian and Ubuntu servers before they take production traffic: fifteen steps, in the order we do them, each with the actual commands. None of it makes a server invulnerable. It closes the easy paths and makes sure you can see what is happening on the box.

One rule before you start: **keep your current SSH session open until you have verified the new one works.** Most hardening lockouts are self-inflicted, and they happen at step 2.

## Access control

### 1. Create a named sudo user and stop working as root

Root should be a login you can reach in an emergency, not the account you use daily. Create a named user, give it sudo, and do everything through it from now on:

```bash
adduser deploy
usermod -aG sudo deploy
```

Copy your SSH key to the new account before going further:

```bash
ssh-copy-id deploy@your-server-ip
# or manually:
# mkdir -p ~/.ssh && chmod 700 ~/.ssh
# paste your public key into ~/.ssh/authorized_keys, then chmod 600 it
```

Log in as the new user in a *second* terminal and confirm `sudo -v` works. Only then continue.

### 2. Switch SSH to key-only authentication

Password authentication is the most attacked surface on a Linux server. Once your key login works, disable passwords and direct root login in `/etc/ssh/sshd_config`:

```ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Validate the configuration before reloading. A syntax error here plus a reload is how people lock themselves out:

```bash
sudo sshd -t && sudo systemctl reload ssh
```

Check the *effective* configuration, not just the file you edited. Drop-in files under `sshd_config.d/` can override the main config without any obvious sign:

```bash
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
```

### 3. Put a firewall in front with default-deny

If a port is not explicitly open, it should not answer. With UFW on Debian/Ubuntu:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH — allow BEFORE enabling
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status verbose
```

Allow SSH *before* `ufw enable`, in the session you are currently using. If you prefer native tooling, the same policy in nftables takes three rules in the `inet filter` table. Either tool works; what matters is that the default is deny.

### 4. Add fail2ban for SSH

A firewall limits where connections come from. fail2ban limits how often an attacker gets to try. Even with password auth disabled, it cuts noise and stops repeated probing. Create `/etc/fail2ban/jail.local`:

```ini
[sshd]
enabled  = true
port     = ssh
maxretry = 5
findtime = 10m
bantime  = 1h
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

## Patching and exposure

### 5. Turn on automatic security updates

An unpatched server gets worse every day it runs. Install unattended-upgrades and enable the security origin:

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Confirm the security repository is enabled in `/etc/apt/apt.conf.d/50unattended-upgrades` (it is by default on Ubuntu; check on Debian). You still need planned reboots, because kernel updates only take effect after one. Schedule a maintenance reboot cadence instead of discovering a three-year uptime later.

### 6. Remove or disable services you do not use

Every listening service is code an attacker can talk to. Audit what is actually running:

```bash
systemctl list-unit-files --state=enabled
sudo ss -tulpn
```

Disable what you cannot justify (`sudo systemctl disable --now <unit>`). The second command matters more: `ss` shows what is *really* listening, including things installed as dependencies of something else. If a service only serves local processes (a database, Redis, an internal metrics endpoint), bind it to `127.0.0.1` instead of `0.0.0.0` in its own config, and confirm with `ss` afterwards.

### 7. Apply a short, deliberate sysctl baseline

Kernel network settings are where hardening guides go wrong most often: readers paste 40-line sysctl lists they do not understand. Keep it to settings you can explain. In `/etc/sysctl.d/99-hardening.conf`:

```ini
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.ip_forward = 0
kernel.randomize_va_space = 2
```

`ip_forward = 0` is right for a server that is not a router or Kubernetes node. If this box *is* a node or VPN gateway, leave forwarding on. Apply with `sudo sysctl --system` and re-check the effective values with `sysctl net.ipv4.tcp_syncookies`.

### 8. Tighten file permissions where it is cheap

Set a stricter default umask for interactive shells (`umask 027` in `/etc/profile.d/umask.sh`), and audit for world-writable files, which should be rare and intentional:

```bash
sudo find / -xdev -type f -perm -0002 -ls 2>/dev/null
```

Mounting `/tmp` as `noexec,nosuid,nodev` is a reasonable extra on a dedicated server, but test it on your stack first. Some installers extract and execute from `/tmp` and will fail in ways that are annoying to debug at 2 a.m.

## Visibility

### 9. Make logs persistent and make sure time is correct

On a default install, journald may keep logs only in memory or rotate them away quickly. Set `Storage=persistent` in `/etc/systemd/journald.conf` and restart journald, so the evidence of an incident survives the reboot that follows it.

Then fix the clock. Logs with wrong timestamps are nearly useless, and TLS validation breaks outright when time drifts:

```bash
timedatectl
sudo apt install chrony
sudo systemctl enable --now chrony
```

On higher-value servers, `auditd` with a small ruleset for authentication files and sudo use is worth adding. Persistent logs and a correct clock come first, though. Without them the fancier tooling has nothing solid to build on.

### 10. Watch the door: log review and alerts

If nobody ever looks at the logs, the rest of this list only gets you so far. At minimum, know what normal `auth.log` traffic looks like:

```bash
sudo grep "Failed password\|Failed publickey" /var/log/auth.log | tail
sudo lastb | head
```

fail2ban already bans; pair it with a daily summary (logwatch, or a small cron job mailing `fail2ban-client status` and failed-login counts) so a sudden spike in attempts reaches you from your own tooling, not from your hosting provider's abuse desk.

## Data protection

### 11. Encrypt backups and keep them off the box

Backups on the same server protect you from fat-finger deletions and nothing else. They do not survive ransomware, disk failure, or a compromised root account deleting them. Send encrypted backups to object storage or a second location, and treat "the backup job exits 0" as meaningless until you have restored from one. We cover backup design for databases in depth elsewhere; for hardening purposes, an untested, unencrypted, same-box backup fails in three different ways at once. If you would rather have this handled, our [Linux server management service](/services/linux-server-management/) includes backup setup and restore testing.

### 12. Encrypt data in transit, everywhere it leaves the box

Any service reachable over the network should be behind TLS, including admin panels and staging sites. Attackers enumerate staging precisely because people protect production and forget it exists. For websites that means HTTPS with automatic renewal (Let's Encrypt via certbot or your reverse proxy's built-in ACME). For internal traffic between servers, use WireGuard or SSH tunnels rather than plaintext protocols "because it is a private network." Private networks get breached; encryption is what limits the blast radius.

## Verification

### 13. Verify listening ports against your intent

You allowed 22/80/443 in the firewall and bound internal services to localhost. Prove it from outside the box:

```bash
# from your own machine, not the server:
nmap -Pn -p- your-server-ip
```

The result should match your intent exactly. Any surprise port is either a service you forgot or a config that did not do what you thought.

### 14. Verify SSH's effective configuration, not the file

Worth repeating as its own habit: `sudo sshd -T` prints the configuration sshd will actually use, after all includes and overrides. Check it after every change to SSH, and check the same way for other daemons that support a config-test mode (`nginx -t`, `apachectl configtest`, `postfix check`).

### 15. Run an auditor and record the baseline

[Lynis](https://cisofy.com/lynis/) is a well-maintained open-source auditor that checks hundreds of settings and explains each finding:

```bash
sudo apt install lynis
sudo lynis audit system
```

You will not fix every suggestion. Some do not apply to your workload, and a few trade usability for marginal gain. Save the report anyway, note which findings you accepted, fixed, or consciously skipped, and re-run after major changes. That record turns "we hardened it once in 2026" into an actual maintenance practice. For servers running containers or clusters, the same habit applies one layer up. It is the discipline we use in [Kubernetes and DevOps work](/services/kubernetes-devops/), where a [failed sync or a red cluster](/blog/argocd-sync-failed-common-causes/) usually traces back to an unverified assumption.

## Common mistakes

- Locking yourself out. Changing sshd config and firewall rules in the same session, then closing it. Work in two sessions, validate before reload, and know your provider's out-of-band console exists before you need it.
- Copying maximal sysctl lists. Settings copied from forums can break routing, container networking, or VPNs. Apply few settings, understand each, verify after.
- Hardening once, patching never. The initial checklist takes an hour. The servers that get compromised two years later are the ones where step 5 was skipped.
- Security through obscurity as the whole plan. Moving SSH to a random port reduces log noise; it is not a control. Keys, firewall, and patching are the controls.

## FAQ

### Is changing the SSH port worth it?

It reduces automated noise in your logs, which has some value, but it does nothing against a targeted attempt and can complicate firewall rules and team access. Do it if you like quiet logs; do not count it as a hardening step.

### Should I disable IPv6 if I do not use it?

If the server genuinely has no IPv6, disabling it removes a class of "forgotten firewall" mistakes. An open IPv6 listener behind an IPv4-only firewall is a real and common failure. If you disable it, disable it fully (including in the firewall policy); if you use it, firewall it with the same default-deny rules as IPv4.

### How often should I re-run this checklist?

After any major change (new services, new team members with access, OS upgrade), and on a fixed quarterly review for patching, accounts, and listening ports. Settings drift as people change things; the review catches the drift.

### What is the minimum viable version of this for a side project?

Steps 1 to 6: named sudo user, key-only SSH, default-deny firewall, fail2ban, automatic security updates, and no unused services. That is under an hour and removes the overwhelming majority of opportunistic attacks.

## The short version

Create a sudo user and kill password SSH. Default-deny the firewall, ban repeat offenders, and turn on automatic security updates. Expose nothing you do not use. Log persistently, keep the clock right, and keep encrypted backups somewhere else. Then scan the box from outside and check the effective configs, because the files you edited are not proof of anything. Fifteen steps, roughly an hour, plus a quarterly hour to keep it true.

If you would rather spend that hour on your product, our [Linux server management service](/services/linux-server-management/) covers hardening, patching, monitoring, and backups as ongoing operations. Or [get in touch](/contact/) and describe the server you have.
