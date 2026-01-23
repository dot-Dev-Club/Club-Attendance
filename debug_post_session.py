import json
import urllib.request
url = 'http://127.0.0.1:8000/sessions'
payload = {
    'id': 'session-test-001',
    'name': 'Test Session via Python',
    'date': '2026-01-22',
    'time': '10:00',
    'club_id': 'club-1',
    'created_by': 'user-1'
}
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req) as res:
        body = res.read().decode('utf-8')
        print('STATUS', res.status)
        print('BODY', body)
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    try:
        print(e.read().decode('utf-8'))
    except:
        pass
except Exception as e:
    print('ERR', e)
