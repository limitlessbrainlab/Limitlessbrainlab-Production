# Email Deliverability Setup — Keeping Mail Out of Spam

> **History:** An earlier version of this doc described a **Brevo** setup with a
> `@gmail.com` From address. That is obsolete. Brevo has been removed from the
> code; all mail now sends via **Gmail / Google Workspace SMTP** from a domain
> address. Do **not** re-add the Brevo SPF record (`include:spf.brevo.com`) — it
> does not authorize Google's servers and would break authentication.

## How mail is sent today

- **Transport:** `smtp.gmail.com:465` (`secure: true`), authenticated as
  `EMAIL_USER = info@limitlessbrainlab.com` — a real Google Workspace mailbox.
  See `server/index.js` (`createTransport`) and `api/send-report-email.js`.
- **From:** `"Limitless Brain Lab" <info@limitlessbrainlab.com>`
  (constant `EMAIL_FROM`, `server/index.js`). Because the From domain and the
  authenticated account share the domain, **SPF, DKIM, and DMARC all align.**
- **Render must be on a paid plan** — the free tier blocks SMTP ports 25/465/587,
  so mail would not send at all. See the boot warning in `server/index.js` and
  `render.yaml`.

## DNS (already live and correct — verify, don't change)

Current published records for `limitlessbrainlab.com`:

| Type | Name                 | Value |
|------|----------------------|-------|
| TXT  | `@`                  | `v=spf1 include:_spf.google.com ~all` |
| TXT  | `google._domainkey`  | Google Workspace DKIM key (`v=DKIM1; k=rsa; p=…`) |
| TXT  | `_dmarc`             | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:…` |
| MX   | `@`                  | `smtp.google.com` |

Verify any time with:

```bash
dig +short TXT limitlessbrainlab.com            # SPF
dig +short TXT google._domainkey.limitlessbrainlab.com   # DKIM
dig +short TXT _dmarc.limitlessbrainlab.com     # DMARC
```

DKIM for Google Workspace is enabled in the **Google Admin console**
(Apps → Google Workspace → Gmail → Authenticate email), which publishes the
`google._domainkey` record above.

## Code-level anti-spam measures (in the app)

These are applied automatically to every send by `enhanceMailOptions()` /
`patchSendMail()` in `server/index.js`:

- **Multipart:** a plain-text alternative is derived from every HTML body.
- **From display name:** bare addresses are wrapped as `"Limitless Brain Lab" <…>`.
- **`List-Unsubscribe`** header on every message (report/OTP flows set their own).
- **`Reply-To`** applied from `EMAIL_REPLY_TO` when set.
- **No remote images:** the shared footer uses text links for social media (not
  hotlinked icons); the logo and signature are embedded as `cid:` attachments.
  The Vercel report sender (`api/send-report-email.js`) can't read `/public`, so
  it loads the logo from the brand domain `https://limitlessbrainlab.com/…`.
- **No free-mail address in bodies:** contact copy uses `info@limitlessbrainlab.com`.

## Optional improvements

- Point the DMARC `rua=` to a **monitored inbox** so authentication failures are
  visible (it currently reports to a registrar default address).
- Reputation is built by consistent, wanted mail over time — no code change fixes
  a cold-domain reputation.

## Verify a real send

Send any app email (e.g. password reset or report-ready) to the address shown at
<https://www.mail-tester.com> and confirm **SPF, DKIM, and DMARC all PASS** with a
**9–10/10** score and no "contains remote images" / "reply-to a free address"
penalties. In Gmail, use **Show original** to confirm `SPF: PASS`, `DKIM: PASS`,
`DMARC: PASS`, and that a `List-Unsubscribe` header is present.
