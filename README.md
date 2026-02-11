# Club Attendance Management System

A full-stack web application for managing club attendance at Karunya Institute of Technology and Sciences. Each club (DotDev, Unbiased Club, etc.) gets its own dashboard where admins and tutors can manage sessions, students, mark attendance, and sync everything to Google Sheets automatically.

---

## Features

- **Role-based access** — Admins and Tutors with per-club data isolation
- **Session management** — Create, edit, delete sessions with auto-sync to Google Sheets
- **Student management** — Add, edit, remove students with auto-sync to Google Sheets
- **Attendance marking** — Time-window-based attendance (2-hour window per session) with Present / Late / Absent
- **Google Sheets integration** — Per-club spreadsheets:
  - `{ClubName} Sessions` — yearly worksheets with weekly session rows
  - `{ClubName} Students` — flat student roster with join dates
  - `Week {n} Attendance` tabs inside the Sessions spreadsheet
- **Save to Sheet** button for attendance — explicitly sync attendance data after marking
- **Dashboard** — Charts and stats (attendance rate, session history, student performance)
- **Attendance history** — View detailed per-session and per-student records
- **Dark mode** — Full dark/light theme support
- **Responsive design** — Works on desktop and mobile

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Recharts | Dashboard charts |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| SQLAlchemy | ORM / database |
| SQLite | Database (default) |
| Pydantic | Request/response validation |
| Passlib + bcrypt | Password hashing |
| gspread | Google Sheets API |
| google-auth | Google OAuth2 authentication |

---

## Project Structure

```
project/
├── src/                        # Frontend (React)
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Loading.tsx
│   │       ├── Modal.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── Toast.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Login / logout state
│   │   └── DataContext.tsx      # All data fetching & mutations
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Attendance.tsx
│   │   ├── Sessions.tsx
│   │   ├── Students.tsx
│   │   ├── History.tsx
│   │   └── Login.tsx
│   └── types/index.ts
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app & all endpoints
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── crud.py             # Database operations
│   │   ├── database.py         # DB engine & session
│   │   └── sheets.py           # Google Sheets sync logic
│   ├── seed.py                 # Seed clubs & users
│   ├── requirements.txt
│   ├── client_secret.json      # Google OAuth client secrets
│   └── oauth_token.json        # OAuth token (auto-generated)
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **Google Cloud** project with Sheets API enabled (for Google Sheets sync)

### 1. Clone the repository

```bash
git clone <repo-url>
cd project
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\activate
# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with clubs and users
python seed.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend setup

```bash
# From the project root
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:8000`.

### 4. Google Sheets setup (optional)

**Option A: Service Account**
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Set environment variable: `GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/key.json`

**Option B: OAuth2**
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Download `client_secret.json` and place it in `backend/`
3. Visit `http://localhost:8000/sheets/oauth/start` to authorize
4. Token is saved automatically to `backend/oauth_token.json`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/login` | Authenticate user (email + password) |
| GET | `/sessions?clubId=` | List sessions for a club |
| POST | `/sessions` | Create a new session (auto-syncs to Sheets) |
| PUT | `/sessions/{id}` | Update a session (auto-syncs to Sheets) |
| DELETE | `/sessions/{id}` | Delete a session (auto-syncs to Sheets) |
| GET | `/students?clubId=` | List students for a club |
| POST | `/students` | Add a student (auto-syncs to Sheets) |
| PUT | `/students/{id}` | Update a student (auto-syncs to Sheets) |
| DELETE | `/students/{id}` | Delete a student (auto-syncs to Sheets) |
| GET | `/users?clubId=` | List users (admins/tutors) for a club |
| GET | `/attendance/session/{id}` | Get attendance records for a session |
| POST | `/attendance/save` | Save/update attendance records |
| POST | `/sheets/save` | Explicitly save attendance to Google Sheets |
| GET | `/sheets/oauth/start` | Start Google OAuth flow |
| GET | `/sheets/oauth/callback` | OAuth callback handler |

---

## Google Sheets Structure

For each club, two spreadsheets are created automatically:

### `{ClubName} Sessions`
- One worksheet per year (e.g., `2026`)
- Columns: `SessionID | Week | Name | Date | Day | Time | CreatedBy | CreatedAt`
- Attendance stored in `Week {n} Attendance` tabs
- Attendance columns: `SessionID | SessionName | StudentID | StudentName | Status | MarkedBy | MarkedAt`

### `{ClubName} Students`
- Single `Students` worksheet
- Columns: `StudentID | Name | Email | RegisterNo | JoinedDate`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./db.sqlite` | Database connection string |
| `FRONTEND_ORIGIN` | `*` | CORS allowed origin |
| `VITE_API_BASE` | `http://localhost:8000` | API base URL (frontend) |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | — | Path to service account JSON |
| `GOOGLE_OAUTH_CLIENT_SECRETS` | `backend/client_secret.json` | Path to OAuth client secrets |
| `GOOGLE_OAUTH_TOKEN_FILE` | `backend/oauth_token.json` | Path to OAuth token file |
| `OAUTH_REDIRECT_URI` | `http://localhost:8000/sheets/oauth/callback` | OAuth redirect URI |

---

## Seeded Data

The `seed.py` script creates:

**Clubs:**
- DotDev — Development and tech community
- Unbiased Club — Open discussion and debate

**Users:** Admins and tutors for each club with pre-set credentials (see `seed.py` for details).

---

## License

This project is for internal use at Karunya Institute of Technology and Sciences.
