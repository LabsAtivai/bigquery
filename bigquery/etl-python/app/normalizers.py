# app/normalizers.py
import unicodedata
import re

def normalize_text(value):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    value = value.upper()
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ASCII", "ignore").decode("utf-8")
    value = re.sub(r"\s+", " ", value).strip()
    return value or None

def normalize_email(email):
    if not email:
        return None
    return str(email).strip().lower()

def normalize_phone(phone):
    if not phone:
        return None
    return re.sub(r"\D", "", str(phone))