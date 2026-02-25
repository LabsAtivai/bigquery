# app/drive_sync.py
import os
from typing import Optional, Dict
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

DRIVE_SYNC_DB = os.getenv("DRIVE_SYNC_DB", "etl")
DRIVE_SYNC_COLLECTION = os.getenv("DRIVE_SYNC_COLLECTION", "drive_sync")

class DriveSyncStore:
    def __init__(self, mongo_uri: str):
        self.client = MongoClient(mongo_uri)
        self.col = self.client[DRIVE_SYNC_DB][DRIVE_SYNC_COLLECTION]
        self.col.create_index([("file_id", 1)], unique=True)

    def get(self, file_id: str) -> Optional[Dict]:
        return self.col.find_one({"file_id": file_id}, {"_id": 0})

    def upsert(self, file_id: str, modified_time: str, name: str, folder_id: str, folder_name: str):
        self.col.update_one(
            {"file_id": file_id},
            {"$set": {
                "file_id": file_id,
                "modified_time": modified_time,
                "name": name,
                "folder_id": folder_id,
                "folder_name": folder_name,
            }},
            upsert=True
        )

    def close(self):
        self.client.close()