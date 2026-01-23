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


def _month_sheet_title(date_obj: datetime):
    return f"{date_obj.year}-{date_obj.month:02d} Attendance"


def _week_of_month(date_obj: datetime) -> int:
    return ((date_obj.day - 1) // 7) + 1


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
            # save refreshed token
            with open(token_file, 'w', encoding='utf-8') as fh:
                fh.write(creds.to_json())
        client = gspread.authorize(creds)
        return client
    except Exception as e:
        LOG.exception('OAuth credentials invalid: %s', e)
        return None


def _get_client():
    if gspread is None:
        raise RuntimeError('gspread not installed')
    # prefer service account
    client = _get_client_via_service_account()
    if client:
        return client
    # fallback to oauth token
    client = _get_client_via_oauth()
    if client:
        return client
    raise RuntimeError('No Google credentials found; set GOOGLE_SERVICE_ACCOUNT_FILE or complete OAuth flow')


def save_session_attendance(session: dict, attendance_items: list[dict], marked_by: str):
    try:
        client = _get_client()
    except Exception as e:
        LOG.exception('Unable to obtain gspread client: %s', e)
        return {'ok': False, 'error': str(e)}

    try:
        dt = datetime.fromisoformat(session.get('date'))
    except Exception:
        dt = datetime.utcnow()

    title = os.getenv('GOOGLE_SPREADSHEET_TITLE') or _month_sheet_title(dt)
    spreadsheet_id = os.getenv('GOOGLE_SPREADSHEET_ID')

    try:
        if spreadsheet_id:
            sh = client.open_by_key(spreadsheet_id)
        else:
            try:
                sh = client.open(title)
            except Exception:
                sh = client.create(title)
    except Exception as e:
        LOG.exception('Failed to open/create spreadsheet: %s', e)
        return {'ok': False, 'error': str(e)}

    week = _week_of_month(dt)
    ws_title = f'Week {week}'

    try:
        try:
            ws = sh.worksheet(ws_title)
        except Exception:
            ws = sh.add_worksheet(title=ws_title, rows=1000, cols=10)

        session_row = ['SESSION', session.get('name', ''), session.get('date', ''), session.get('time', ''), marked_by]
        ws.append_row(session_row)
        ws.append_row(['Student ID', 'Status'])
        for it in attendance_items:
            sid = it.get('studentId') or it.get('student_id')
            status = it.get('status')
            ws.append_row([sid, status])

        return {'ok': True}
    except Exception as e:
        LOG.exception('Failed to write to sheet: %s', e)
        return {'ok': False, 'error': str(e)}
