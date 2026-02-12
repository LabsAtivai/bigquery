import unicodedata
import re

def normalize_text(value):
    if not value:
        return None
    value = str(value).strip().upper()
    value = unicodedata.normalize('NFKD', value)
    value = value.encode('ASCII', 'ignore').decode('utf-8')
    return value

def normalize_email(email):
    if not email:
        return None
    return email.strip().lower()

def normalize_phone(phone):
    if not phone:
        return None
    return re.sub(r'\D', '', str(phone))