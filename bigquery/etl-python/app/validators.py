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

    if size in allowed:
        return size

    return None

# Adicionei na refatoração, mas se não quiser, remova
def is_valid_phone(phone):
    if not phone:
        return False
    return bool(re.match(r'^\d{8,15}$', phone))