# Email Deliverability Setup — Stop Mails Going to Spam

## Root cause (found 2026-06-10)

Outbound mail is sent through **Brevo SMTP** but the From address is
`noreplylimitlessbrainlab@gmail.com`. A `@gmail.com` From address sent via
non-Google servers fails SPF and DKIM alignment, so Gmail/Outlook treat it as
spoofed mail and send it to spam. Additionally, `limitlessbrainlab.com` has
**no SPF, DKIM, or DMARC records** in DNS.

Code-level mitigations (plain-text alternative part, Reply-To support) are
already applied in `server/index.js`. The steps below are the actual fix and
require the Brevo dashboard + the Vercel account that owns the domain DNS.

## Step 1 — Authenticate the domain in Brevo

Brevo dashboard → **Senders & Domains → Domains → Add a domain** →
`limitlessbrainlab.com`. Brevo shows 2–3 DNS records (a `brevo-code` TXT and a
DKIM TXT at `mail._domainkey`). Add them in Vercel DNS, then click
**Authenticate** in Brevo.

## Step 2 — Add SPF + DMARC in Vercel DNS

The domain uses Vercel nameservers (`ns1/ns2.vercel-dns.com`). In the Vercel
dashboard of the account that owns `limitlessbrainlab.com` (Domains → DNS):

| Type | Name     | Value |
|------|----------|-------|
| TXT  | `@`      | `v=spf1 include:spf.brevo.com ~all` |
| TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:chatgptnotes@gmail.com` |

After 2–4 weeks of clean DMARC reports, tighten `p=none` → `p=quarantine`.

## Step 3 — Switch the From address (Render env vars)

Only after Step 1 shows "Authenticated" in Brevo:

- `EMAIL_FROM=noreply@limitlessbrainlab.com`
- `EMAIL_REPLY_TO=<monitored inbox>` (optional — replies to noreply mail get
  routed here; the code applies it automatically when set)

Add `noreply@limitlessbrainlab.com` as a verified sender in Brevo if prompted.

## Step 4 — Verify

Send any app email to the address shown at https://www.mail-tester.com and
confirm SPF, DKIM, and DMARC all pass and the score is 9–10/10.
