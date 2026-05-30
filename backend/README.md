---
title: Iris Guard
emoji: 🦀
colorFrom: yellow
colorTo: green
sdk: docker
pinned: false
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

## Running locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment

| Variable | Default | What it does |
| --- | --- | --- |
| `FIREBASE_CREDENTIALS_JSON` | — | Service account JSON as a single line, used in deploys |
| `FIREBASE_CREDENTIALS_PATH` | `./firebase_credentials.json` | Local fallback for the above |
| `TELEGRAM_BOT_TOKEN` | — | Bot that sends OTPs and scan snapshots |
| `TELEGRAM_CHAT_ID` | — | Admin chat that receives the snapshots |
| `FACE_MATCH_THRESHOLD` | `0.5` | Face distance below which a scan counts as a match |
| `SNAPSHOT_RETENTION_DAYS` | `14` | Age at which snapshot folders get purged |
| `LOG_LEVEL` | `INFO` | Level for the shared logger |

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Uptime check, no dependencies |
| POST | `/iris/scan` | Face scan, returns match + overlay + snapshot |
| POST | `/otp/send` | Telegram OTP, 3 per 10 min per email |
| POST | `/otp/verify` | Code is valid 5 min, dies after 5 wrong tries |
| POST | `/enroll/` | Enroll a face, `{name, email, telegram_id, image_base64}` |
| DELETE | `/enroll/{person_id}` | Remove an enrolled face |
| GET | `/admin/logs?limit=&method=` | Access history |
| GET | `/admin/enrolled-users` | Everyone enrolled |
| POST | `/admin/snapshots/cleanup` | Purge old snapshot folders |
