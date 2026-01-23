# Club Attendance Backend

This is a minimal FastAPI backend for the Club Attendance frontend.

Features:
- SQLite + SQLAlchemy models for clubs, users, students, sessions, and attendance records
- Endpoints:
  - POST /login { "email": "..." }
  - GET /sessions?clubId=club-1
  - GET /students?clubId=club-1
  - GET /attendance/session/{session_id}
  - POST /attendance/save { sessionId, markedBy, items: [{ studentId, status }] }

Quick start:

1. Create a virtual environment and install:

```bash
python -m venv .venv
.\.venv\Scripts\activate    # Windows
pip install -r backend/requirements.txt
```

2. Run the app:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

3. The SQLite DB will be created at `backend/db.sqlite` by default.

Notes:
- This is a simple reference backend to connect to your frontend. You may adapt security (authentication), validation, and schema details as needed.

OAuth Google Sheets setup

1. Create OAuth client credentials in Google Cloud Console:
  - Go to APIs & Services > Credentials
  - Create OAuth 2.0 Client ID (Web application)
  - Add Authorized redirect URI: `http://localhost:8000/sheets/oauth/callback`
  - Download the JSON and save to `backend/client_secret.json` (or another path and set `GOOGLE_OAUTH_CLIENT_SECRETS`).

2. Install requirements in your backend venv:

```powershell
& "D:/CLUB ATTENDANCE/.venv/Scripts/python.exe" -m pip install -r requirements.txt
```

3. Start backend and begin OAuth flow (this will redirect you to Google sign-in):

```powershell
# start server
& "D:/CLUB ATTENDANCE/.venv/Scripts/python.exe" -m uvicorn app.main:app --reload
# in a browser, visit:
http://localhost:8000/sheets/oauth/start
```

4. After consenting with the `vishwav@karunya.edu.in` Google account, the callback will save a token file at `backend/oauth_token.json` (or set `GOOGLE_OAUTH_TOKEN_FILE` to a different path).

5. Now clicking "Save to sheet" in the app will write into the authenticated user's Drive (monthly spreadsheet created if necessary).

Environment variables (optional):
- `GOOGLE_OAUTH_CLIENT_SECRETS` - path to client_secret JSON
- `GOOGLE_OAUTH_TOKEN_FILE` - path to save token JSON
- `OAUTH_REDIRECT_URI` - callback URL (default `http://localhost:8000/sheets/oauth/callback`)

Security notes:
- Do not commit `client_secret.json` or token files to source control.
- Keep the token file protected; it grants access to the Google account's Drive and Sheets.
