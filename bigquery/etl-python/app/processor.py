# app/processor.py
import os
import logging
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

from .normalizers import normalize_email, normalize_phone, normalize_text
from .validators import is_valid_email, valid_company_size
from .mapping_presets import build_auto_mapping

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BATCH_SIZE = 2000
DEFAULT_DB = os.getenv("MONGO_DB", "bigquery")
DEFAULT_COLLECTION = os.getenv("MONGO_COLLECTION", "leads")

GEO_DB = os.getenv("GEO_DB", "geo")
GEO_COLLECTION = os.getenv("GEO_COLLECTION", "geo_locations")

# Somente os campos que você quer exibir/exportar
ALLOWED_FIELDS = {
    "email",
    "nome",
    "nome_completo",
    "linkedin",
    "cargo",
    "pais",
    "localizacao",
    "empresa",
    "url_empresa",
    "tamanho",
    "pais_empresa",
    "localizacao_empresa",
    "estado_empresa",
    "cidade_empresa",
    "setor_empresa",
    "import_id",
    "updated_at",
}

def split_first_name(full_name: Optional[str]) -> Optional[str]:
    if not full_name:
        return None
    parts = str(full_name).strip().split()
    return parts[0] if parts else None

def join_location(city: Optional[str], state: Optional[str], country: Optional[str]) -> Optional[str]:
    parts = []
    if city: parts.append(city)
    if state: parts.append(state)
    if country: parts.append(country)
    return " - ".join(parts) if parts else None

class GeoResolver:
    def __init__(self, mongo_client: MongoClient):
        self.col = mongo_client[GEO_DB][GEO_COLLECTION]

    def resolve(self, pais: Optional[str], estado: Optional[str], uf: Optional[str], cidade: Optional[str]) -> Dict[str, Optional[str]]:
        pais = normalize_text(pais)
        estado = normalize_text(estado)
        uf = normalize_text(uf)
        cidade = normalize_text(cidade)

        if pais and estado and cidade:
            doc = self.col.find_one({"pais": pais, "estado": estado, "cidade": cidade}, {"_id": 0})
            if doc:
                return {"pais": doc.get("pais"), "estado": doc.get("estado"), "uf": doc.get("uf"), "cidade": doc.get("cidade")}

        if pais and cidade:
            doc = self.col.find_one({"pais": pais, "cidade": cidade}, {"_id": 0})
            if doc:
                return {"pais": doc.get("pais"), "estado": doc.get("estado"), "uf": doc.get("uf"), "cidade": doc.get("cidade")}

        if estado and cidade:
            doc = self.col.find_one({"estado": estado, "cidade": cidade}, {"_id": 0})
            if doc:
                return {"pais": doc.get("pais"), "estado": doc.get("estado"), "uf": doc.get("uf"), "cidade": doc.get("cidade")}

        if uf:
            doc = self.col.find_one({"uf": uf}, {"_id": 0})
            if doc:
                return {"pais": doc.get("pais"), "estado": doc.get("estado"), "uf": doc.get("uf"), "cidade": cidade}

        if cidade:
            doc = self.col.find_one({"cidade": cidade}, {"_id": 0})
            if doc:
                return {"pais": doc.get("pais"), "estado": doc.get("estado"), "uf": doc.get("uf"), "cidade": doc.get("cidade")}

        return {"pais": pais, "estado": estado, "uf": uf, "cidade": cidade}

def clean_and_normalize_row(row: pd.Series, mapping: Dict[str, str], geo: GeoResolver) -> Optional[Dict[str, Any]]:
    record: Dict[str, Any] = {
        "import_id": row.get("import_id"),
        "updated_at": datetime.utcnow(),
    }

    email_col = mapping.get("email")
    if not email_col or email_col not in row or pd.isna(row[email_col]):
        return None

    email = normalize_email(row[email_col])
    if not is_valid_email(email):
        return None

    record["email"] = email

    for field, col in (mapping or {}).items():
        if field == "email":
            continue
        if not col or col not in row or pd.isna(row[col]):
            continue

        value = row[col]
        if pd.isna(value):
            continue

        if field in ["phone", "celular", "whatsapp", "telefone_sede", "telefone"]:
            value = normalize_phone(value)

        elif field in [
            "nome", "nome_completo", "linkedin", "cargo",
            "empresa", "setor_empresa",
            "pais", "localizacao",
            "cidade_empresa", "estado_empresa", "pais_empresa",
            "localizacao_empresa",
            "url_empresa"
        ]:
            value = normalize_text(value)

        elif field in ["tamanho", "tamanho_empresa"]:
            value = valid_company_size(value)

        else:
            value = str(value).strip() or None

        if value:
            if field == "tamanho_empresa":
                record["tamanho"] = value
            else:
                record[field] = value

    # nome a partir do nome_completo
    if record.get("nome_completo") and not record.get("nome"):
        record["nome"] = split_first_name(record.get("nome_completo"))

    # GEO da empresa via banco local
    resolved = geo.resolve(
        pais=record.get("pais_empresa"),
        estado=record.get("estado_empresa"),
        uf=None,
        cidade=record.get("cidade_empresa"),
    )

    if not record.get("pais_empresa") and resolved.get("pais"):
        record["pais_empresa"] = normalize_text(resolved["pais"])
    if not record.get("estado_empresa") and resolved.get("estado"):
        record["estado_empresa"] = normalize_text(resolved["estado"])
    if not record.get("cidade_empresa") and resolved.get("cidade"):
        record["cidade_empresa"] = normalize_text(resolved["cidade"])

    # monta localizacao_empresa
    if not record.get("localizacao_empresa"):
        record["localizacao_empresa"] = join_location(
            record.get("cidade_empresa"),
            record.get("estado_empresa"),
            record.get("pais_empresa"),
        )

    # fallback simples para localizacao pessoa
    if not record.get("localizacao") and record.get("pais"):
        record["localizacao"] = record.get("pais")

    # keep only allowed fields
    record = {k: v for k, v in record.items() if k in ALLOWED_FIELDS and v is not None}

    return record if record.get("email") else None

def process_file(import_id: str, file_path: str, mapping: Dict[str, str]) -> Dict[str, int]:
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI não configurado no .env")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")

    logger.info(f"Iniciando processamento | import_id={import_id} | arquivo={file_path}")

    df = pd.read_csv(
        file_path,
        sep=";",
        encoding="utf-8",
        dtype=str,
        on_bad_lines="warn",
        low_memory=False,
    )

    total_rows = len(df)
    logger.info(f"Linhas lidas: {total_rows:,}")

    if df.empty:
        return {"total_rows": 0, "processed": 0, "invalid": 0, "duplicated": 0}

    # mantém header original (com acento e caps)
    df.columns = df.columns.str.strip()

    # automapping pelo header se mapping vazio
    if not mapping:
        mapping = build_auto_mapping(list(df.columns))

    email_col = mapping.get("email")
    if not email_col or email_col not in df.columns:
        raise ValueError(f"Coluna de email não encontrada. Mapping gerado: {mapping}")

    # filtro inicial
    df = df[df[email_col].notna() & df[email_col].astype(str).str.contains("@", na=False)]
    df[email_col] = df[email_col].astype(str).str.strip().str.lower()

    # duplicatas internas
    before = len(df)
    df = df.drop_duplicates(subset=[email_col], keep="first")
    duplicated_internal = before - len(df)

    processed = 0
    invalid = total_rows - len(df)
    operations = []

    client = MongoClient(mongo_uri)
    leads_col = client[DEFAULT_DB][DEFAULT_COLLECTION]
    geo = GeoResolver(client)

    try:
        for i in range(0, len(df), BATCH_SIZE):
            batch = df.iloc[i : i + BATCH_SIZE]

            for _, row in batch.iterrows():
                record = clean_and_normalize_row(row, mapping, geo)
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
                result = leads_col.bulk_write(operations, ordered=False)
                processed += result.modified_count + result.upserted_count
                logger.info(
                    f"Batch {i//BATCH_SIZE + 1} concluído | ops={len(operations)} | upserted={result.upserted_count} | modified={result.modified_count}"
                )
                operations.clear()

    finally:
        client.close()

    summary = {
        "total_rows": total_rows,
        "processed": processed,
        "invalid": max(0, total_rows - processed),
        "duplicated": duplicated_internal,
    }

    logger.info(f"Processamento finalizado | {summary}")
    return summary