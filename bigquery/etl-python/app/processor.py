import os
import logging
import pandas as pd
from typing import Dict, Any
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

from .normalizers import normalize_email, normalize_phone, normalize_text
from .validators import is_valid_email, valid_company_size

load_dotenv()

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BATCH_SIZE = 2000
DEFAULT_DB = os.getenv("MONGO_DB", "bigquery")
DEFAULT_COLLECTION = os.getenv("MONGO_COLLECTION", "leads")

def clean_and_normalize_row(row: pd.Series, mapping: Dict[str, str]) -> Dict[str, Any]:
    """Processa uma linha inteira: limpeza + normalização + validação"""
    record = {
        "import_id": row.get("import_id"),  # será sobrescrito depois
        "updated_at": datetime.utcnow(),
    }

    email_col = mapping.get("email")
    if not email_col or pd.isna(row[email_col]):
        return None

    email = normalize_email(row[email_col])
    if not is_valid_email(email):
        return None

    record["email"] = email

    # Campos mapeados
    for field, col in mapping.items():
        if field == "email" or col not in row or pd.isna(row[col]):
            continue

        value = row[col]
        if pd.isna(value):
            continue

        # Normalização por tipo de campo (expanda conforme necessário)
        if field in ["phone", "celular", "whatsapp"]:
            value = normalize_phone(value)
        elif field in ["nome", "cargo", "empresa", "segmento", "cidade", "estado", "pais"]:
            value = normalize_text(value)
        elif field == "tamanho_empresa":
            value = valid_company_size(value)
        else:
            value = str(value).strip() or None

        if value:
            record[field] = value

    return record if record.get("email") else None

def process_file(import_id: str, file_path: str, mapping: Dict[str, str]) -> Dict[str, int]:
    """
    Processa CSV → limpa → normaliza → upsert em batches no MongoDB
    """
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI não configurado no .env")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")

    logger.info(f"Iniciando processamento | import_id={import_id} | arquivo={file_path}")

    # Leitura otimizada
    try:
        df = pd.read_csv(
            file_path,
            sep=";",
            encoding="utf-8",
            dtype=str,
            on_bad_lines="warn",
            low_memory=False,
        )
    except Exception as e:
        logger.error(f"Erro ao ler CSV: {e}")
        raise

    total_rows = len(df)
    logger.info(f"Linhas lidas: {total_rows:,}")

    if df.empty:
        return {"total_rows": 0, "processed": 0, "invalid": 0, "duplicated": 0}

    # Limpeza inicial de colunas
    df.columns = df.columns.str.strip().str.lower()
    email_col = mapping.get("email", "email").lower()

    if email_col not in df.columns:
        raise ValueError(f"Coluna de email '{email_col}' não encontrada no CSV")

    # Filtro rápido inicial
    df = df[df[email_col].notna() & df[email_col].str.contains("@", na=False)]
    df[email_col] = df[email_col].str.strip().str.lower()

    # Remove duplicatas internas (mesmo arquivo)
    df = df.drop_duplicates(subset=[email_col], keep="first")

    processed = 0
    invalid = total_rows - len(df)
    operations = []

    client = MongoClient(mongo_uri)
    collection = client[DEFAULT_DB][DEFAULT_COLLECTION]

    try:
        for i in range(0, len(df), BATCH_SIZE):
            batch = df.iloc[i : i + BATCH_SIZE]

            for _, row in batch.iterrows():
                record = clean_and_normalize_row(row, mapping)
                if not record:
                    invalid += 1
                    continue

                record["import_id"] = import_id

                operations.append(
                    UpdateOne(
                        {"email": record["email"]},
                        {"$set": record},
                        upsert=True,
                    )
                )

            if operations:
                try:
                    result = collection.bulk_write(operations, ordered=False)
                    processed += result.modified_count + result.upserted_count
                    logger.info(
                        f"Batch {i//BATCH_SIZE + 1} concluído | ops={len(operations)} | upserted={result.upserted_count} | modified={result.modified_count}"
                    )
                except Exception as e:
                    logger.error(f"Erro no bulk_write do batch {i//BATCH_SIZE + 1}: {e}")

                operations.clear()

        # Futuro: sync com BigQuery (ex: após process, load table via google-cloud-bigquery)
        # from google.cloud import bigquery
        # client = bigquery.Client()
        # job = client.load_table_from_dataframe(df, 'project.dataset.leads')  # exemplo

    finally:
        client.close()

    invalid = total_rows - processed

    summary = {
        "total_rows": total_rows,
        "processed": processed,
        "invalid": invalid,
        "duplicated": 0,
    }

    logger.info(f"Processamento finalizado | {summary}")
    return summary