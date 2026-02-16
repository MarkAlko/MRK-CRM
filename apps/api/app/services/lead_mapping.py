"""
Bot field mapping service for all 4 project tracks.
Maps Hebrew strings from WhatsApp bot to structured lead fields.
"""
from typing import Any, Optional

TIMELINE_MAP: dict[str, str] = {
    "מיידית": "immediate",
    "מיידית / בחודש הקרוב": "immediate",
    "1–3 חודשים": "1_3_months",
    "לאחר קבלת היתר": "after_permit",
    "עדיין לא יודעים / לטווח ארוך": "long_term",
    "3–6 חודשים": "long_term",
    "עדיין לא בטוחים": "unknown",
    "לא מוגדר": "unknown",
}

PLANS_STATUS_MAP: dict[str, str] = {
    "אין תכנון": "none_need_planning",
    "בתהליך תכנון": "in_planning",
    "כן – יש תכניות מלאות": "has_full_plans",
}

PERMIT_STATUS_MAP: dict[str, str] = {
    "כן – היתר בתוקף": "valid",
    "היתר בתהליך הגשה": "in_process",
    "אין היתר": "none_need_support",
}

BUILDING_TYPE_MAP: dict[str, str] = {
    "בית פרטי / דירת קרקע": "private_or_ground",
    "דירה בקומה / בניין רב קומות": "apartment_or_building",
}

SITE_ACCESS_MAP: dict[str, str] = {
    "גישה מלאה": "full",
    "גישה חלקית": "partial",
    "גישה רגלית בלבד": "pedestrian_only",
}

MAMAD_VARIANT_MAP: dict[str, str] = {
    'ממ"ד ברישוי מקוצר (9 מ"ר נטו)': "fast_license_9",
    'ממ"ד בהיתר מלא (גדול מ-9)': "full_permit_gt9",
    'ממ"ד 12 מ"ר כולל חדר רחצה': "m12_with_bath",
    'ממ"ד 15 מ"ר כולל חדר רחצה': "m15_with_bath",
}

PRIVATE_STAGE_MAP: dict[str, str] = {
    "בניית וילה / בית פרטי מלא": "full_house",
    "בניית שלד בלבד": "shell_only",
    "תוספת קומה / הרחבת בית קיים": "add_floor_or_expand",
    "עבודות גמר מלאות": "finishes_full",
}

PRIVATE_SIZE_BUCKET_MAP: dict[str, str] = {
    "עד 120": "up_to_120",
    "120–250": "120_250",
    "מעל 250": "250_plus",
}

PRIVATE_SPECIAL_STRUCT_MAP: dict[str, str] = {
    "מרתף": "basement",
    'ממ"ד': "mamad",
    "בריכה": "pool",
    "גג רעפים": "roof_tiles",
    "מספר פריטים": "multiple",
}

ARCH_SERVICE_MAP: dict[str, str] = {
    "תכנון עד ביצוע": "planning_to_execution",
    "תכנון אדריכלי מלא לפרויקט חדש": "full_arch_new",
    "הוצאת היתר בנייה / תכנון תוספת": "permit_or_addition",
    "עיצוב פנים בלבד": "interior_only",
}

ARCH_PROPERTY_TYPE_MAP: dict[str, str] = {
    "בית פרטי — עד 150": "house_upto150",
    "בית פרטי — מעל 150": "house_over150",
    "דירה קיימת": "existing_apartment",
    "מגרש ריק / תוספת": "empty_plot_or_addition",
    "לא בטוחים": "unknown",
}

ARCH_PLANNING_STAGE_MAP: dict[str, str] = {
    "אין תכנון": "none",
    "רעיון / סקיצה": "idea_or_sketch",
    "תכנון קיים — נדרש ליווי להיתר": "existing_need_permit",
    "תכנון כמעט מוכן": "almost_ready_adjust",
}

ARCH_EXISTING_DOCS_MAP: dict[str, str] = {
    "מדידה": "survey",
    "תשריט": "map",
    "אדריכלות": "architecture",
    "קונסטרוקציה": "structural",
    "סקיצה": "sketch",
    "אין": "none",
}

RENO_TYPE_MAP: dict[str, str] = {
    "שיפוץ כללי מקיף": "full",
    "שיפוץ חדרי רחצה / מטבח": "bath_kitchen",
    "עבודות גמר אחרי שלד": "finishes_after_shell",
    "תוספת בנייה + שיפוץ": "add_building_plus_reno",
}

RENO_SIZE_BUCKET_MAP: dict[str, str] = {
    "עד 60": "up_to_60",
    "60–120": "60_120",
    "מעל 120": "120_plus",
}

RENO_HAS_PLAN_MAP: dict[str, str] = {
    "כן — תכנית מלאה": "full",
    "תכנית חלקית / סקיצה": "partial",
    "אין תכנית": "none",
}

IS_OCCUPIED_MAP: dict[str, str] = {
    "כן": "true",
    "לא": "false",
}

TRACK_NAME_MAP: dict[str, str] = {
    'ממ"ד': "mamad",
    "ממד": "mamad",
    "בנייה פרטית": "private_home",
    "עבודות גמר": "renovation",
    "שיפוץ": "renovation",
    "אדריכלות": "architecture",
    "רישוי": "architecture",
    "עיצוב פנים": "architecture",
    "אדריכלות / רישוי / עיצוב פנים": "architecture",
}


def _map_value(value: Optional[str], mapping: dict[str, str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    result = mapping.get(value)
    if result is not None:
        return result
    for he_key, en_val in mapping.items():
        if he_key in value or value in he_key:
            return en_val
    return "other_or_unknown"


def _map_list(values: Optional[list[str]], mapping: dict[str, str]) -> Optional[list[str]]:
    if values is None:
        return None
    result = []
    for v in values:
        v = v.strip()
        mapped = mapping.get(v, v)
        result.append(mapped)
    return result if result else None


def _parse_location(location_text: Optional[str]) -> dict[str, Optional[str]]:
    if not location_text:
        return {"city": None, "street": None}
    parts = [p.strip() for p in location_text.split(",")]
    if len(parts) >= 2:
        return {"city": parts[0], "street": parts[1]}
    return {"city": location_text.strip(), "street": None}


def resolve_track(track: Optional[str]) -> Optional[str]:
    if not track:
        return None
    track = track.strip()
    if track in ("mamad", "private_home", "renovation", "architecture"):
        return track
    return TRACK_NAME_MAP.get(track)


def map_common_fields(payload: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key in ("timeline", "start_timeline"):
        if key in payload and payload[key]:
            result["start_timeline"] = _map_value(payload[key], TIMELINE_MAP)
            break
    if payload.get("plans_status"):
        result["plans_status"] = _map_value(payload["plans_status"], PLANS_STATUS_MAP)
    if payload.get("permit_status"):
        result["permit_status"] = _map_value(payload["permit_status"], PERMIT_STATUS_MAP)
    if payload.get("building_type"):
        result["building_type"] = _map_value(payload["building_type"], BUILDING_TYPE_MAP)
    if payload.get("site_access"):
        result["site_access"] = _map_value(payload["site_access"], SITE_ACCESS_MAP)
    if payload.get("location"):
        loc = _parse_location(payload["location"])
        if loc["city"]:
            result["city"] = loc["city"]
        if loc["street"]:
            result["street"] = loc["street"]
    else:
        if payload.get("city"):
            result["city"] = payload["city"].strip()
        if payload.get("street"):
            result["street"] = payload["street"].strip()
    if payload.get("full_name"):
        result["full_name"] = payload["full_name"].strip()
    return result


def map_mamad_fields(payload: dict[str, Any]) -> dict[str, Any]:
    result = map_common_fields(payload)
    result["bot_track"] = "mamad"
    if payload.get("mamad_variant"):
        result["mamad_variant"] = _map_value(payload["mamad_variant"], MAMAD_VARIANT_MAP)
    return result


def map_private_home_fields(payload: dict[str, Any]) -> dict[str, Any]:
    result = map_common_fields(payload)
    result["bot_track"] = "private_home"
    if payload.get("private_stage"):
        result["private_stage"] = _map_value(payload["private_stage"], PRIVATE_STAGE_MAP)
    raw_size = payload.get("estimated_size") or payload.get("estimated_size_bucket")
    if raw_size:
        result["estimated_size_bucket"] = _map_value(raw_size, PRIVATE_SIZE_BUCKET_MAP)
    if payload.get("private_special_struct"):
        raw = payload["private_special_struct"]
        if isinstance(raw, list):
            mapped = []
            for item in raw:
                m = PRIVATE_SPECIAL_STRUCT_MAP.get(item.strip(), item.strip())
                mapped.append(m)
                if "בריכה" in item and "גג" in item:
                    if "pool" not in mapped:
                        mapped.append("pool")
                    if "roof_tiles" not in mapped:
                        mapped.append("roof_tiles")
            result["private_special_struct"] = list(set(mapped))
        elif isinstance(raw, str):
            result["private_special_struct"] = [PRIVATE_SPECIAL_STRUCT_MAP.get(raw.strip(), raw.strip())]
    return result


def map_renovation_fields(payload: dict[str, Any]) -> dict[str, Any]:
    result = map_common_fields(payload)
    result["bot_track"] = "renovation"
    if payload.get("reno_type"):
        result["reno_type"] = _map_value(payload["reno_type"], RENO_TYPE_MAP)
    raw_size = payload.get("estimated_size") or payload.get("estimated_size_bucket")
    if raw_size:
        result["estimated_size_bucket"] = _map_value(raw_size, RENO_SIZE_BUCKET_MAP)
    if payload.get("reno_has_plan"):
        result["reno_has_plan"] = _map_value(payload["reno_has_plan"], RENO_HAS_PLAN_MAP)
    if payload.get("is_occupied"):
        val = IS_OCCUPIED_MAP.get(payload["is_occupied"].strip())
        if val is not None:
            result["is_occupied"] = val
    return result


def map_architecture_fields(payload: dict[str, Any]) -> dict[str, Any]:
    result = map_common_fields(payload)
    result["bot_track"] = "architecture"
    if payload.get("arch_service"):
        result["arch_service"] = _map_value(payload["arch_service"], ARCH_SERVICE_MAP)
    if payload.get("arch_property_type"):
        result["arch_property_type"] = _map_value(payload["arch_property_type"], ARCH_PROPERTY_TYPE_MAP)
    if payload.get("arch_planning_stage"):
        result["arch_planning_stage"] = _map_value(payload["arch_planning_stage"], ARCH_PLANNING_STAGE_MAP)
    if payload.get("arch_existing_docs"):
        raw = payload["arch_existing_docs"]
        if isinstance(raw, list):
            result["arch_existing_docs"] = _map_list(raw, ARCH_EXISTING_DOCS_MAP)
        elif isinstance(raw, str):
            result["arch_existing_docs"] = _map_list([raw], ARCH_EXISTING_DOCS_MAP)
    return result


TRACK_MAPPERS = {
    "mamad": map_mamad_fields,
    "private_home": map_private_home_fields,
    "renovation": map_renovation_fields,
    "architecture": map_architecture_fields,
}


def map_bot_payload(track: str, payload: dict[str, Any]) -> dict[str, Any]:
    mapper = TRACK_MAPPERS.get(track)
    if mapper is None:
        result = map_common_fields(payload)
        result["bot_track"] = track
        return result
    return mapper(payload)
