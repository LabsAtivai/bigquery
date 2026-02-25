# main.py
import os
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Dict, List, Optional

from app.processor import process_file
from app.drive_ingest import ingest_drive_folders

load_dotenv()

app = FastAPI()

# -----------------------------
# PROCESSAR UM ARQUIVO LOCAL
# -----------------------------
class ProcessRequest(BaseModel):
    import_id: str
    file_path: str
    mapping: dict = {}

def background_process(request: ProcessRequest):
    process_file(
        import_id=request.import_id,
        file_path=request.file_path,
        mapping=request.mapping or {}
    )

@app.post("/process")
async def process_import(request: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(background_process, request)
    return {"message": "Processamento iniciado em background", "import_id": request.import_id}


# -----------------------------
# PROCESSAR DRIVE (6 PASTAS)
# -----------------------------
class DriveFolder(BaseModel):
    name: str
    id_or_url: str

class DriveIngestRequest(BaseModel):
    import_id: str
    mongo_uri: str
    folders: List[DriveFolder]

def background_drive(req: DriveIngestRequest):
    ingest_drive_folders(
        import_id=req.import_id,
        mongo_uri=req.mongo_uri,
        folders=[f.model_dump() for f in req.folders],
    )

@app.post("/process-drive")
async def process_drive(req: DriveIngestRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(background_drive, req)
    return {"message": "Ingest do Drive iniciado", "import_id": req.import_id}