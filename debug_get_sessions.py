import json
import urllib.request
import urllib.parse
url = 'http://127.0.0.1:8000/sessions?clubId=club-1'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as res:
    body = res.read().decode('utf-8')
    print(body)
