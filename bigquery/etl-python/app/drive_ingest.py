# app/drive_ingest.py
import os
from typing import Dict, Any, List
from dotenv import load_dotenv

from .drive_client import list_files_in_folder, download_file, extract_folder_id
from .drive_sync import DriveSyncStore
from .processor import process_file

load_dotenv()

DOWNLOAD_DIR = os.getenv("DRIVE_DOWNLOAD_DIR", "./drive_downloads")

def should_process(file_meta: Dict[str, Any], last: Dict[str, Any] | None) -> bool:
    if not last:
        return True
    return (last.get("modified_time") != file_meta.get("modifiedTime"))

def ingest_drive_folders(import_id: str, mongo_uri: str, folders: List[Dict[str, str]]):
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    sync = DriveSyncStore(mongo_uri)

    summary = {
        "folders": len(folders),
        "files_seen": 0,
        "files_processed": 0,
        "files_skipped": 0,
        "results": [],
    }

    try:
        for folder in folders:
            folder_name = folder["name"]
            folder_id = extract_folder_id(folder["id_or_url"])
            if not folder_id:
                summary["results"].append({"folder": folder_name, "error": "folderId inválido"})
                continue

            files = list_files_in_folder(folder_id)
            summary["files_seen"] += len(files)

            for f in files:
                file_id = f["id"]
                name = f["name"]
                modified = f.get("modifiedTime")

                lower = name.lower()
                if not lower.endswith(".csv"):
                    continue

                last = sync.get(file_id)
                if not should_process(f, last):
                    summary["files_skipped"] += 1
                    continue

                local_path = os.path.join(DOWNLOAD_DIR, folder_name, f"{file_id}__{name}")
                download_file(file_id, local_path)

                # mapping vazio -> processor faz automapping pelo header
                result = process_file(
                    import_id=f"{import_id}::{folder_name}::{name}",
                    file_path=local_path,
                    mapping={}
                )

                sync.upsert(
                    file_id=file_id,
                    modified_time=modified,
                    name=name,
                    folder_id=folder_id,
                    folder_name=folder_name,
                )

                summary["files_processed"] += 1
                summary["results"].append({
                    "folder": folder_name,
                    "file": name,
                    "processed": result
                })

        return summary

    finally:
        sync.close()