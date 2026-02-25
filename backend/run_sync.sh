#!/bin/bash
cd /home/jd/projects/Club-Attendance/backend
source venv/bin/activate
export OAUTHLIB_INSECURE_TRANSPORT=1
python app/sync_all_to_sheets.py 2>&1
