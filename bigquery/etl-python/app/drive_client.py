# app/drive_client.py
import os
import io
import re
from typing import List, Dict, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

FOLDER_ID_RE = re.compile(r"/folders/([a-zA-Z0-9_-]+)")
ID_RE = re.compile(r"^[a-zA-Z0-9_-]{10,}$")

def extract_folder_id(value: str) -> Optional[str]:
    if not value:
        return None
    v = value.strip()
    m = FOLDER_ID_RE.search(v)
    if m:
        return m.group(1)
    if ID_RE.match(v):
        return v
    return None

def get_drive_service():
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not os.path.exists(creds_path):
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS não configurado ou arquivo inexistente")

    creds = service_account.Credentials.from_service_account_file(creds_path, scopes=SCOPES)
    return build("drive", "v3", credentials=creds, cache_discovery=False)

def list_files_in_folder(folder_id: str) -> List[Dict]:
    service = get_drive_service()

    q = f"'{folder_id}' in parents and trashed=false"
    files = []
    page_token = None

    while True:
        resp = service.files().list(
            q=q,
            fields="nextPageToken, files(id, name, mimeType, modifiedTime, size)",
            pageToken=page_token,
            pageSize=1000
        ).execute()

        files.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return files

def download_file(file_id: str, dest_path: str) -> str:
    service = get_drive_service()
    request = service.files().get_media(fileId=file_id)

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    fh = io.FileIO(dest_path, "wb")
    downloader = MediaIoBaseDownload(fh, request, chunksize=1024 * 1024)

    done = False
    while not done:
        _, done = downloader.next_chunk()

    fh.close()
    return dest_path