import os
from datetime import datetime
import logging
from typing import Optional

try:
    import gspread
except Exception:
    gspread = None

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import Flow
except Exception:
    Credentials = None
    Request = None
    Flow = None

LOG = logging.getLogger('sheets')

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
]

# ---------------------------------------------------------------------------
# Credential helpers
# ---------------------------------------------------------------------------

def _get_client_via_service_account() -> Optional[object]:
    if gspread is None:
        return None
    sa_path = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE') or os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if sa_path and os.path.exists(sa_path):
        return gspread.service_account(filename=sa_path)
    return None


def _get_client_via_oauth() -> Optional[object]:
    if gspread is None or Credentials is None:
        return None
    token_file = os.getenv('GOOGLE_OAUTH_TOKEN_FILE')
    if not token_file:
        token_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'oauth_token.json'))
    if not os.path.exists(token_file):
        return None
    try:
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_file, 'w', encoding='utf-8') as fh:
                fh.write(creds.to_json())
        return gspread.authorize(creds)
    except Exception as e:
        LOG.exception('OAuth credentials invalid: %s', e)
        return None


def _get_client():
    if gspread is None:
        raise RuntimeError('gspread not installed')
    client = _get_client_via_service_account()
    if client:
        return client
    client = _get_client_via_oauth()
    if client:
        return client
    raise RuntimeError('No Google credentials found; set GOOGLE_SERVICE_ACCOUNT_FILE or complete OAuth flow')

# ---------------------------------------------------------------------------
# Spreadsheet helpers
# ---------------------------------------------------------------------------

def _open_or_create(client, title: str):
    """Open a spreadsheet by title, create it if it doesn't exist."""
    try:
        return client.open(title)
    except gspread.SpreadsheetNotFound:
        return client.create(title)


def _get_year_from_date(date_str: str) -> int:
    try:
        return datetime.fromisoformat(date_str).year
    except Exception:
        return datetime.now().year


def _week_of_year(date_str: str) -> int:
    """Return ISO week number for the given date string."""
    try:
        dt = datetime.fromisoformat(date_str)
    except Exception:
        dt = datetime.now()
    return dt.isocalendar()[1]


def _find_row_by_id(ws, col: int, search_id: str) -> Optional[int]:
    """Find the 1-based row number where column `col` equals `search_id`."""
    try:
        cell = ws.find(search_id, in_column=col)
        if cell:
            return cell.row
    except Exception:
        pass
    return None

# ============================================================================
# SESSIONS SHEET  —  one spreadsheet per club: "{ClubName} Sessions"
#   • One worksheet per year e.g. "2026"
#   • Row format: [SessionID, Week, Name, Date, Day, Time, CreatedBy, CreatedAt]
# ============================================================================

SESSION_HEADERS = ['SessionID', 'Week', 'Name', 'Date', 'Day', 'Time', 'CreatedBy', 'CreatedAt']


def _get_sessions_spreadsheet(client, club_name: str):
    title = f"{club_name} Sessions"
    return _open_or_create(client, title)


def _get_year_worksheet(sh, year: int):
    ws_title = str(year)
    try:
        ws = sh.worksheet(ws_title)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=ws_title, rows=1000, cols=len(SESSION_HEADERS))
        ws.append_row(SESSION_HEADERS)
    first_row = ws.row_values(1)
    if not first_row or first_row[0] != 'SessionID':
        ws.insert_row(SESSION_HEADERS, index=1)
    return ws


def save_session_to_sheet(club_name: str, session: dict) -> dict:
    """Add a new session row to the club's Sessions spreadsheet."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_sessions_spreadsheet(client, club_name)
        year = _get_year_from_date(session.get('date', ''))
        ws = _get_year_worksheet(sh, year)
        week = _week_of_year(session.get('date', ''))

        try:
            dt = datetime.fromisoformat(session.get('date', ''))
            day_name = dt.strftime('%A')
        except Exception:
            day_name = ''

        row = [
            session.get('id', ''),
            f"Week {week}",
            session.get('name', ''),
            session.get('date', ''),
            day_name,
            session.get('time', ''),
            session.get('created_by', ''),
            session.get('created_at', datetime.now().isoformat()),
        ]
        ws.append_row(row, value_input_option='USER_ENTERED')
        return {'ok': True}
    except Exception as e:
        LOG.exception('save_session_to_sheet error: %s', e)
        return {'ok': False, 'error': str(e)}


def update_session_in_sheet(club_name: str, session_id: str, session: dict) -> dict:
    """Find the session row by ID and update it in-place."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_sessions_spreadsheet(client, club_name)
        for ws in sh.worksheets():
            row_num = _find_row_by_id(ws, 1, session_id)
            if row_num:
                existing = ws.row_values(row_num)
                date_val = session.get('date', existing[3] if len(existing) > 3 else '')
                week = _week_of_year(date_val)
                try:
                    dt = datetime.fromisoformat(date_val)
                    day_name = dt.strftime('%A')
                except Exception:
                    day_name = existing[4] if len(existing) > 4 else ''

                updated_row = [
                    session_id,
                    f"Week {week}",
                    session.get('name', existing[2] if len(existing) > 2 else ''),
                    date_val,
                    day_name,
                    session.get('time', existing[5] if len(existing) > 5 else ''),
                    existing[6] if len(existing) > 6 else '',
                    existing[7] if len(existing) > 7 else '',
                ]
                ws.update(f'A{row_num}:H{row_num}', [updated_row], value_input_option='USER_ENTERED')
                return {'ok': True}

        return {'ok': False, 'error': 'Session not found in any sheet'}
    except Exception as e:
        LOG.exception('update_session_in_sheet error: %s', e)
        return {'ok': False, 'error': str(e)}


def delete_session_from_sheet(club_name: str, session_id: str) -> dict:
    """Find and delete the session row from the sheet."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_sessions_spreadsheet(client, club_name)
        for ws in sh.worksheets():
            row_num = _find_row_by_id(ws, 1, session_id)
            if row_num:
                ws.delete_rows(row_num)
                return {'ok': True}
        return {'ok': False, 'error': 'Session not found in any sheet'}
    except Exception as e:
        LOG.exception('delete_session_from_sheet error: %s', e)
        return {'ok': False, 'error': str(e)}

# ============================================================================
# STUDENTS SHEET  —  one spreadsheet per club: "{ClubName} Students"
#   • Single worksheet "Students"
#   • Row format: [StudentID, Name, Email, RegisterNo, JoinedDate]
# ============================================================================

STUDENT_HEADERS = ['StudentID', 'Name', 'Email', 'RegisterNo', 'JoinedDate']


def _get_students_spreadsheet(client, club_name: str):
    title = f"{club_name} Students"
    return _open_or_create(client, title)


def _get_students_worksheet(sh):
    ws_title = 'Students'
    try:
        ws = sh.worksheet(ws_title)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=ws_title, rows=1000, cols=len(STUDENT_HEADERS))
        ws.append_row(STUDENT_HEADERS)
    first_row = ws.row_values(1)
    if not first_row or first_row[0] != 'StudentID':
        ws.insert_row(STUDENT_HEADERS, index=1)
    return ws


def save_student_to_sheet(club_name: str, student: dict) -> dict:
    """Add a student row to the club's Students spreadsheet."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_students_spreadsheet(client, club_name)
        ws = _get_students_worksheet(sh)
        row = [
            student.get('id', ''),
            student.get('name', ''),
            student.get('email', ''),
            student.get('register_no', '') or '',
            student.get('enrollment_date', '') or student.get('enrollmentDate', '') or datetime.now().strftime('%Y-%m-%d'),
        ]
        ws.append_row(row, value_input_option='USER_ENTERED')
        return {'ok': True}
    except Exception as e:
        LOG.exception('save_student_to_sheet error: %s', e)
        return {'ok': False, 'error': str(e)}


def update_student_in_sheet(club_name: str, student_id: str, student: dict) -> dict:
    """Find the student row by ID and update it in-place."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_students_spreadsheet(client, club_name)
        ws = _get_students_worksheet(sh)
        row_num = _find_row_by_id(ws, 1, student_id)
        if not row_num:
            return {'ok': False, 'error': 'Student not found in sheet'}

        existing = ws.row_values(row_num)
        updated_row = [
            student_id,
            student.get('name', existing[1] if len(existing) > 1 else ''),
            student.get('email', existing[2] if len(existing) > 2 else ''),
            student.get('register_no', existing[3] if len(existing) > 3 else '') or '',
            existing[4] if len(existing) > 4 else '',  # keep original join date
        ]
        ws.update(f'A{row_num}:E{row_num}', [updated_row], value_input_option='USER_ENTERED')
        return {'ok': True}
    except Exception as e:
        LOG.exception('update_student_in_sheet error: %s', e)
        return {'ok': False, 'error': str(e)}


def delete_student_from_sheet(club_name: str, student_id: str) -> dict:
    """Find and delete the student row from the sheet."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_students_spreadsheet(client, club_name)
        ws = _get_students_worksheet(sh)
        row_num = _find_row_by_id(ws, 1, student_id)
        if not row_num:
            return {'ok': False, 'error': 'Student not found in sheet'}
        ws.delete_rows(row_num)
        return {'ok': True}
    except Exception as e:
        LOG.exception('delete_student_from_sheet error: %s', e)
        return {'ok': False, 'error': str(e)}

# ============================================================================
# ATTENDANCE  —  saved into the club's Sessions spreadsheet
#   • Dedicated worksheet per week: "Week {n} Attendance"
#   • Row: [SessionID, SessionName, StudentID, StudentName, Status, MarkedBy, MarkedAt]
# ============================================================================

ATTENDANCE_HEADERS = ['SessionID', 'SessionName', 'StudentID', 'StudentName', 'Status', 'MarkedBy', 'MarkedAt']


def save_session_attendance(club_name: str, session: dict, attendance_items: list, marked_by: str) -> dict:
    """Save attendance records into the club's Sessions spreadsheet under a week attendance tab."""
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('sheets client error: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        sh = _get_sessions_spreadsheet(client, club_name)
        week = _week_of_year(session.get('date', ''))
        ws_title = f"Week {week} Attendance"

        try:
            ws = sh.worksheet(ws_title)
        except gspread.WorksheetNotFound:
            ws = sh.add_worksheet(title=ws_title, rows=1000, cols=len(ATTENDANCE_HEADERS))
            ws.append_row(ATTENDANCE_HEADERS)

        first_row = ws.row_values(1)
        if not first_row or first_row[0] != 'SessionID':
            ws.insert_row(ATTENDANCE_HEADERS, index=1)

        session_id = session.get('id', '')
        session_name = session.get('name', '')
        now_str = datetime.now().isoformat()

        # Remove existing attendance rows for this session to avoid duplicates
        try:
            all_values = ws.get_all_values()
            rows_to_delete = []
            for i, row in enumerate(all_values):
                if i == 0:
                    continue
                if len(row) > 0 and row[0] == session_id:
                    rows_to_delete.append(i + 1)
            for row_num in reversed(rows_to_delete):
                ws.delete_rows(row_num)
        except Exception:
            pass

        # Append new attendance rows
        for item in attendance_items:
            sid = item.get('studentId') or item.get('student_id', '')
            sname = item.get('studentName') or item.get('student_name', '')
            status = item.get('status', '')
            row = [session_id, session_name, sid, sname, status, marked_by, now_str]
            ws.append_row(row, value_input_option='USER_ENTERED')

        return {'ok': True}
    except Exception as e:
        LOG.exception('save_session_attendance error: %s', e)
        return {'ok': False, 'error': str(e)}
