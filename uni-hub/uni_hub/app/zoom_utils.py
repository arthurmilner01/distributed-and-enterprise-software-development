import base64
import requests
from django.conf import settings

def get_zoom_access_token():
    auth_str = f"{settings.ZOOM_CLIENT_ID}:{settings.ZOOM_CLIENT_SECRET}"
    auth_bytes = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {auth_bytes}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "account_credentials",
        "account_id": settings.ZOOM_ACCOUNT_ID
    }

    response = requests.post("https://zoom.us/oauth/token", headers=headers, data=data)
    return response.json().get("access_token")

def create_zoom_meeting(topic, start_time_iso, duration=60):
    token = get_zoom_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    data = {
        "topic": topic,
        "type": 2,
        "start_time": start_time_iso,
        "duration": duration,
        "timezone": "UTC",
        "settings": {
            "join_before_host": True,
            "meeting_authentication": False
        }
    }

    zoom_user = settings.ZOOM_USER_EMAIL or "me"
    response = requests.post(
        f"https://api.zoom.us/v2/users/{zoom_user}/meetings",
        headers=headers,
        json=data
    )

    return response.json()
