# Hosting the public demo

How the demo at `demo.mdbnavigator.com` is run: one small server, Docker Compose with `compose.demo.yaml` (the app, the sample database and Caddy in front for HTTPS), DNS at Cloudflare, and email sent through Brevo. For now `mdbnavigator.com` and `www.mdbnavigator.com` redirect to the demo; the root stays free for something else later.

Anyone can run their own the same way with their own domain: replace `<domain>` everywhere below with the domain itself (e.g. `mdbnavigator.com`). The demo then runs at `demo.<domain>`; the emails come from `support@<domain>`.

What the setup protects and why: [security.md, Public demo](security.md#public-demo).

Never put real addresses, emails or secrets into this file.

## Contents

1. [What you need](#1-what-you-need)
2. [The server](#2-the-server)
3. [DNS at Cloudflare](#3-dns-at-cloudflare)
4. [Mail records](#4-mail-records)
5. [First login and the basics](#5-first-login-and-the-basics)
6. [Docker and automatic updates](#6-docker-and-automatic-updates)
7. [The app](#7-the-app)
8. [Checks](#8-checks)
9. [The weekly rebuild](#9-the-weekly-rebuild)
10. [Uptime monitor](#10-uptime-monitor)
11. [Day to day](#11-day-to-day)
12. [When something is wrong](#12-when-something-is-wrong)

## 1. What you need

- Accounts at **Hetzner Cloud** (the server), **Cloudflare** (the domain's DNS), **Brevo** (sending email, with the domain authenticated) and **UptimeRobot** (the uptime monitor).
- A **password manager**, for the server's `.env`, the `mdbnav` user's password and the admin password.
- An **SSH key**. On Windows, in PowerShell:

```sh
ssh-keygen -t ed25519 -C "mdbnavigator-server"
```

The public half is `~\.ssh\id_ed25519.pub`; that is the one you give Hetzner.

## 2. The server

**First the firewall** (Hetzner Console → Firewalls → Create Firewall), named `mdbnavigator`:

| Direction | Protocol | Port |
|---|---|---|
| Inbound | TCP | 22 |
| Inbound | TCP | 80 |
| Inbound | TCP | 443 |
| Inbound | UDP | 443 |
| Inbound | ICMP | |

Outbound stays open. The firewall is the provider's, not `ufw` on the server: Docker's published ports bypass `ufw`, and a firewall outside the server can't be switched off from inside it.

**Then the server** (Hetzner Console → Servers → Add Server):

- Location: one in the EU.
- Image: Ubuntu 24.04.
- Type: shared vCPU, x86, the smallest with 2 vCPU and 4 GB RAM.
- Networking: public IPv4 and IPv6 both on. IPv6 costs nothing; it just gets no DNS record (section 3).
- SSH key: the one from section 1.
- Firewall: `mdbnavigator`.
- Backups: **off**. The visitor list must be gone 90 days after the last visit, as the demo terms promise, and a backup would keep it longer.
- Name: `mdbnavigator`.

Note the server's IPv4 address.

## 3. DNS at Cloudflare

Do this now: the records need a few minutes before the first start, and Caddy can't get a certificate without them.

Cloudflare → the domain → DNS → Records. **Every record "DNS only" (grey cloud).** Cloudflare suggests "Proxied" for new records; switch it off.

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `demo` | the server's IPv4 address | DNS only |
| A | `@` | the server's IPv4 address | DNS only |
| CNAME | `www` | `<domain>` | DNS only |

`demo` is the demo itself; `@` (the domain) and `www` only redirect to it. A subdomain costs nothing: it is just a record. When the domain later serves something else, point `@` and `www` elsewhere and take them out of `MDBNAV_REDIRECT_DOMAINS` (section 7).

No `AAAA` records: Docker hands IPv6 connections to a container from an address of its own, so every IPv6 visitor would share one address and its limits.

DNS → Settings → **DNSSEC: Enable**.

Check from your own machine; all three give the server's address:

```sh
nslookup demo.<domain> 1.1.1.1
nslookup <domain> 1.1.1.1
nslookup www.<domain> 1.1.1.1
```

## 4. Mail records

- **Cloudflare Email Routing** (Email → Email Routing) already forwards `support@<domain>` to your own inbox, and added its MX, SPF (`TXT @ "v=spf1 include:_spf.mx.cloudflare.net ~all"`) and DKIM records. Leave them as they are.
- **Brevo:** Senders, Domains & Dedicated IPs → Domains → add `<domain>` → Authenticate. Add exactly the records Brevo shows (a `brevo-code` TXT, the DKIM records and a DMARC record), with these rules:
  - Every one **DNS only**. A proxied DKIM CNAME breaks DKIM.
  - **Never a second SPF record.** If Brevo asks for an SPF include, add it to the existing record: `v=spf1 include:_spf.mx.cloudflare.net include:<Brevo's> ~all`.
  - The DMARC record is `_dmarc` TXT `v=DMARC1; p=none` for now.

  Press Verify in Brevo until it shows the domain as authenticated. If Brevo asks for a verified sender, add `support@<domain>`.
- An **SMTP key:** Brevo → SMTP & API → SMTP → Generate a new SMTP key. The login shown there is `MDBNAV_SMTP_USERNAME`, the key is `MDBNAV_SMTP_PASSWORD`.

DMARC is tightened in section 8, after a test email shows it passing.

## 5. First login and the basics

As root, once:

```sh
ssh root@<server address>
apt update && apt full-upgrade -y
adduser mdbnav                       # asks for a password: it's for sudo; keep it in the password manager
usermod -aG sudo mdbnav
install -d -m 700 -o mdbnav -g mdbnav /home/mdbnav/.ssh
install -m 600 -o mdbnav -g mdbnav /root/.ssh/authorized_keys /home/mdbnav/.ssh/authorized_keys
reboot
```

Then, in a **new** terminal, `ssh mdbnav@<server address>` must work before you go on. Lock SSH down (keys only, no root):

```sh
sudo tee /etc/ssh/sshd_config.d/10-mdbnavigator.conf >/dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
sudo sshd -t && sudo systemctl restart ssh
sudo sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication) '
```

The last command prints all three as `no`. Keep this terminal open until `ssh mdbnav@<server address>` still works from another one. The `10-` prefix matters: the first value sshd reads wins, and Ubuntu's cloud image may ship a `50-cloud-init.conf` that allows passwords.

Swap, for the builds (the UI build alone may use up to 4 GB):

```sh
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h        # Swap: 4.0Gi
timedatectl    # Time zone: Etc/UTC
```

## 6. Docker and automatic updates

Install Docker Engine from Docker's apt repository, as https://docs.docker.com/engine/install/ubuntu/ describes ("Install using the apt repository"; packages `docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`). Then:

```sh
sudo usermod -aG docker mdbnav
```

Sign out and in again; `docker run --rm hello-world` now works without sudo. The `docker` group is as powerful as root, which is fine here: `mdbnav` is the only user.

**Automatic updates.** Ubuntu's own security updates are on by default; this adds Docker's packages (the engine is what keeps the containers apart) and a reboot when an update needs one:

```sh
cat /etc/apt/apt.conf.d/20auto-upgrades     # both lines end in "1"; if the file is missing: sudo dpkg-reconfigure -plow unattended-upgrades
apt-cache policy docker-ce | grep -m1 'o=Docker'   # shows o=Docker,...,l=Docker CE
sudo tee /etc/apt/apt.conf.d/52mdbnavigator >/dev/null <<'EOF'
// Docker's packages too: the engine is what keeps the containers apart.
Unattended-Upgrade::Origins-Pattern {
        "origin=Docker,label=Docker CE";
};
// Reboot for a new kernel at 04:30 UTC; the containers start again by themselves.
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
EOF
sudo unattended-upgrade --dry-run --debug 2>&1 | grep -i 'allowed origins'   # lists origin=Docker,label=Docker CE
```

If `apt-cache policy` shows other `o=` or `l=` values than `Docker` and `Docker CE`, use those in the file.

## 7. The app

```sh
sudo install -d -o mdbnav -g mdbnav /opt/mdbnavigator
git clone https://github.com/KalliMan/MDBNavigator.git /opt/mdbnavigator
cd /opt/mdbnavigator
cp .env.example .env && chmod 600 .env
openssl rand -hex 16       # run once per invite code and for the demo_reader password
openssl rand -base64 24    # the admin password
nano .env
```

The repository is cloned over HTTPS, so the server holds no GitHub credentials. What goes into `.env`:

| Setting | Value |
|---|---|
| `COMPOSE_FILE` | `docker-compose.yml:compose.demo.yaml` (uncomment it): plain `docker compose ...` commands then always use the demo setup |
| `MDBNAV_ADMIN_EMAIL`, `MDBNAV_ADMIN_PASSWORD` | your email; the random password (the admin can sign in on the public site) |
| `MDBNAV_DEMO_READER_PASSWORD` | random |
| `MDBNAV_PASSWORD_KEY` | empty (no remembered passwords on an instance strangers use) |
| `MDBNAV_DEMO_CODE_LINKEDIN`, `MDBNAV_DEMO_CODE_CV`, `MDBNAV_DEMO_CODE_FRIENDS` | random, one each |
| `MDBNAV_DEMO_OWNER_EMAIL` | your own inbox |
| `MDBNAV_DEMO_CONTACT_EMAIL` | `support@<domain>` |
| `MDBNAV_DOMAIN` | `demo.<domain>` |
| `MDBNAV_REDIRECT_DOMAINS` | `<domain> www.<domain>` (the names that redirect to the demo, separated by spaces) |
| `MDBNAV_EMAIL_FROM` | `support@<domain>` |
| `MDBNAV_SMTP_USERNAME`, `MDBNAV_SMTP_PASSWORD` | Brevo's SMTP login and key |

Copy the finished `.env` into the password manager. Then, once the `nslookup` checks of section 3 pass:

```sh
docker compose up -d --build     # the first build takes a while on two vCPUs; the sample data loads after it
docker compose logs -f caddy     # wait for "certificate obtained successfully" for demo.<domain>, <domain> and www.<domain>; Ctrl+C
docker compose ps                # app, sample-db and caddy are up
```

## 8. Checks

From your own machine:

| Command | Shows |
|---|---|
| `curl -sI https://demo.<domain>/` | `HTTP/2 200`, `strict-transport-security: max-age=31536000`, `content-security-policy`, no `server` or `via` line |
| `curl -sI http://demo.<domain>/` | `308`, `location: https://demo.<domain>/` |
| `curl -sI "https://<domain>/?code=x"` | `302`, `location: https://demo.<domain>/?code=x` |
| `curl -sI https://www.<domain>/x` | `302`, `location: https://demo.<domain>/x` |
| `curl -s https://demo.<domain>/health` | `Healthy` |
| `curl -m 5 http://<server address>:8080/` | times out (the app's own port is not reachable from outside) |
| `ssh root@<server address>` | `Permission denied (publickey)` |

The `strict-transport-security` line also proves the app trusts Caddy: the app sends it only when it believes the request came over HTTPS.

Then in the browser:

1. Open `https://demo.<domain>/?code=<the Friends code>`, press "Try the demo" and give your own email.
2. The email arrives in the inbox, not in spam. In Gmail, "Show original" shows `SPF: PASS`, `DKIM: PASS with domain <domain>` and `DMARC: PASS`.
3. Start the session. `select * from demo.measurements` streams rows (DevTools → Network: `batchCommandResult` with status `101`, a WebSocket).
4. End the demo.

Now tighten DMARC: Cloudflare → the `_dmarc` TXT record → `v=DMARC1; p=quarantine`.

Optional: https://www.ssllabs.com/ssltest/ with "Do not show the results on the boards" ticked gives grade A.

## 9. The weekly rebuild

```sh
sudo cp /opt/mdbnavigator/deploy/mdbnavigator-update.service /opt/mdbnavigator/deploy/mdbnavigator-update.timer /etc/systemd/system/
sudo systemd-analyze verify /etc/systemd/system/mdbnavigator-update.service
sudo systemctl daemon-reload
sudo systemctl enable --now mdbnavigator-update.timer
systemctl list-timers mdbnavigator-update.timer        # NEXT: the coming Sunday 03:30 UTC
sudo systemctl start mdbnavigator-update.service       # once now, to see it work; takes minutes
journalctl -u mdbnavigator-update -n 30 --no-pager     # ends without errors
```

Every Sunday at 03:30 UTC, `deploy/update.sh` pulls Caddy's latest 2.11 release, rebuilds the app and the sample database on fresh base images (.NET, Node, PostgreSQL 17), restarts only what changed, and removes old images and build cache.

- It **never runs `git pull`**: new code goes live only when you pull it yourself (section 11).
- A failed build leaves the running containers as they were.
- A guest in a session at that moment loses it.
- If something stays down, the uptime monitor (section 10) tells you.

## 10. Uptime monitor

UptimeRobot → New monitor: type HTTP(s), URL `https://demo.<domain>/health`, every 5 minutes, alerts by email.

`/health` answers 503 when the app's database doesn't answer, and an expired or broken certificate fails the check too.

## 11. Day to day

In `/opt/mdbnavigator`:

| Task | How |
|---|---|
| Put new code live | `git pull --ff-only && sh deploy/update.sh` |
| Change a setting, rotate or blank an invite code | edit `.env`, then `docker compose up -d` (and update the password manager's copy) |
| Logs | `docker compose logs --since 1h app` (or `sample-db`, `caddy`) |
| Restart | `docker compose restart app` |
| After a reboot | nothing: the containers start by themselves |
| Start over | `docker compose down -v` deletes the visitor list, the admin account and the certificates; mind Let's Encrypt's limit of 5 identical certificates a week |
| Packages (NuGet, npm) | updated in the repository, then "Put new code live" |

## 12. When something is wrong

- **No certificate:** `docker compose logs caddy`. Usually DNS (section 3: every name in `MDBNAV_DOMAIN` and `MDBNAV_REDIRECT_DOMAINS` points at this server, DNS only) or the firewall (ports 80 and 443). Don't restart again and again: Let's Encrypt allows 5 failed validations per hostname per hour.
- **Every visitor seems to share one address, or `strict-transport-security` is missing:** the app's log must have the line "Forwarded headers are trusted from loopback and 1 configured networks: 172.30.254.0/24" (`docker compose logs app | grep Forwarded`). `ReverseProxy__TrustedNetworks__0` and `proxy-net` must use the same `MDBNAV_PROXY_SUBNET`.
- **Emails don't arrive:** `docker compose logs app | grep -i smtp`, and Brevo → Transactional → Logs.
- **The build is killed (out of memory):** `free -h` must show the swap (section 5).
