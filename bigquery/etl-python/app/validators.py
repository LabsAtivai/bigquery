# app/validators.py
import re

def is_valid_email(email):
    if not email:
        return False
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def valid_company_size(size):
    if not size:
        return None

    allowed = [
        "1-10", "11-50", "51-200",
        "201-500", "501-1000",
        "1001-5000", "5001-10000", "10000+"
    ]

    size = str(size).strip()
    return size if size in allowed else None