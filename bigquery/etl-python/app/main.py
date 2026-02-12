import os
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from app.processor import process_file

load_dotenv()

app = FastAPI()

class ProcessRequest(BaseModel):
    import_id: str
    file_path: str
    mapping: dict

def background_process(request: ProcessRequest):
    process_file(
        import_id=request.import_id,
        file_path=request.file_path,
        mapping=request.mapping
    )

@app.post("/process")
async def process_import(request: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(background_process, request)
    return {"message": "Processamento iniciado em background", "import_id": request.import_id}