# Jeonju Travel Planner

Static Jeonju 2-night travel planner with an optional KTX return availability card.

## KTX Return Polling

The return card reads `data/ktx-return.json`. Generate it locally with:

```bash
python3 -m pip install -r requirements.txt
python3 scripts/poll_ktx_return.py
```

The poller checks 2026-06-23 KTX/Korail availability from 전주 to 용산 for 2 passengers, searching hourly windows from 12:00 through 22:00. It uses `KSKILL_KTX_ID` and `KSKILL_KTX_PASSWORD` from the environment first, then falls back to `~/.config/k-skill/secrets.env`.

Example local secret file:

```bash
KSKILL_KTX_ID=your-korail-id
KSKILL_KTX_PASSWORD=your-korail-password
```

Keep that file outside the repo and set permissions to `0600`.

## GitHub Actions Secrets

The hourly workflow `.github/workflows/ktx-return-poll.yml` needs these repository secrets:

- `KSKILL_KTX_ID`
- `KSKILL_KTX_PASSWORD`

No Korail credentials are stored in the repository or used by browser JavaScript. If credentials, packages, or the Korail API are unavailable, the script writes a safe `status: unavailable` JSON for the static card.
