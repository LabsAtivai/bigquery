import os
from app.drive_client import list_files_in_folder

folder_id = "17dB-TcvInt17NTCTHorC6SOFUlU5_Z5b"  # SDR REMOTO

files = list_files_in_folder(folder_id)
print("Arquivos encontrados:", len(files))
for f in files[:10]:
    print(f["name"], f.get("modifiedTime"))