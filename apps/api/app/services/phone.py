import re


def normalize_phone(phone: str) -> str:
    """
    Normalize Israeli phone numbers to a consistent format.
    Strip spaces, dashes, parens. If starts with +, remove.
    If starts with 0, replace with 972. Return digits only.
    """
    cleaned = re.sub(r"[\s\-\(\)\+]", "", phone)
    if cleaned.startswith("0"):
        cleaned = "972" + cleaned[1:]
    return cleaned
