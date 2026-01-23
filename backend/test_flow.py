from google_auth_oauthlib.flow import Flow
import os
p = os.path.abspath('client_secret.json')
print('client_secret exists:', os.path.exists(p), p)
flow = Flow.from_client_secrets_file(p, scopes=['https://www.googleapis.com/auth/spreadsheets'], redirect_uri='http://localhost:8000/sheets/oauth/callback')
print('flow created', type(flow))
