#!/usr/bin/env python3
"""Build processed JSON + simplified GeoJSON for the ONS LE explorer v1."""

from __future__ import annotations

import csv
import gzip
import io
import json
import math
import os
import re
import ssl
import sys
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = Path(os.environ.get("EXPLORER_UPLOADS", ROOT / "uploads"))
IOD_MARKDOWN = Path(
    os.environ.get("EXPLORER_IOD_MARKDOWN", ROOT / "uploads" / "iod.md")
)
OUT_DATA = ROOT / "public" / "data"
OUT_GEO = ROOT / "public" / "geo"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SSL = ssl.create_default_context()

COUNTY_DISTRICTS = {
    "E10000003": [  # Cambridgeshire
        "Cambridge", "East Cambridgeshire", "Fenland", "Huntingdonshire",
        "South Cambridgeshire",
    ],
    "E10000007": [  # Derbyshire
        "Amber Valley", "Bolsover", "Chesterfield", "Derbyshire Dales",
        "Erewash", "High Peak", "North East Derbyshire", "South Derbyshire",
    ],
    "E10000008": [  # Devon
        "East Devon", "Exeter", "Mid Devon", "North Devon", "South Hams",
        "Teignbridge", "Torridge", "West Devon",
    ],
    "E10000011": [  # East Sussex
        "Eastbourne", "Hastings", "Lewes", "Rother", "Wealden",
    ],
    "E10000012": [  # Essex
        "Basildon", "Braintree", "Brentwood", "Castle Point", "Chelmsford",
        "Colchester", "Epping Forest", "Harlow", "Maldon", "Rochford",
        "Tendring", "Uttlesford",
    ],
    "E10000013": [  # Gloucestershire
        "Cheltenham", "Cotswold", "Forest of Dean", "Gloucester", "Stroud",
        "Tewkesbury",
    ],
    "E10000014": [  # Hampshire
        "Basingstoke and Deane", "East Hampshire", "Eastleigh", "Fareham",
        "Gosport", "Hart", "Havant", "New Forest", "Rushmoor", "Test Valley",
        "Winchester",
    ],
    "E10000015": [  # Hertfordshire
        "Broxbourne", "Dacorum", "East Hertfordshire", "Hertsmere",
        "North Hertfordshire", "St Albans", "Stevenage", "Three Rivers",
        "Watford", "Welwyn Hatfield",
    ],
    "E10000016": [  # Kent
        "Ashford", "Canterbury", "Dartford", "Dover", "Folkestone and Hythe",
        "Gravesham", "Maidstone", "Sevenoaks", "Swale", "Thanet",
        "Tonbridge and Malling", "Tunbridge Wells",
    ],
    "E10000017": [  # Lancashire
        "Burnley", "Chorley", "Fylde", "Hyndburn", "Lancaster", "Pendle",
        "Preston", "Ribble Valley", "Rossendale", "South Ribble",
        "West Lancashire", "Wyre",
    ],
    "E10000018": [  # Leicestershire
        "Blaby", "Charnwood", "Harborough", "Hinckley and Bosworth", "Melton",
        "North West Leicestershire", "Oadby and Wigston",
    ],
    "E10000019": [  # Lincolnshire
        "Boston", "East Lindsey", "Lincoln", "North Kesteven", "South Holland",
        "South Kesteven", "West Lindsey",
    ],
    "E10000020": [  # Norfolk
        "Breckland", "Broadland", "Great Yarmouth", "King's Lynn and West Norfolk",
        "North Norfolk", "Norwich", "South Norfolk",
    ],
    "E10000024": [  # Nottinghamshire
        "Ashfield", "Bassetlaw", "Broxtowe", "Gedling", "Mansfield",
        "Newark and Sherwood", "Rushcliffe",
    ],
    "E10000025": [  # Oxfordshire
        "Cherwell", "Oxford", "South Oxfordshire", "Vale of White Horse",
        "West Oxfordshire",
    ],
    "E10000028": [  # Staffordshire
        "Cannock Chase", "East Staffordshire", "Lichfield", "Newcastle-under-Lyme",
        "South Staffordshire", "Stafford", "Staffordshire Moorlands", "Tamworth",
    ],
    "E10000029": [  # Suffolk
        "Babergh", "East Suffolk", "Ipswich", "Mid Suffolk", "West Suffolk",
    ],
    "E10000030": [  # Surrey
        "Elmbridge", "Epsom and Ewell", "Guildford", "Mole Valley",
        "Reigate and Banstead", "Runnymede", "Spelthorne", "Surrey Heath",
        "Tandridge", "Waverley", "Woking",
    ],
    "E10000031": [  # Warwickshire
        "North Warwickshire", "Nuneaton and Bedworth", "Rugby",
        "Stratford-on-Avon", "Warwick",
    ],
    "E10000032": [  # West Sussex
        "Adur", "Arun", "Chichester", "Crawley", "Horsham", "Mid Sussex",
        "Worthing",
    ],
    "E10000034": [  # Worcestershire
        "Bromsgrove", "Malvern Hills", "Redditch", "Worcester", "Wychavon",
        "Wyre Forest",
    ],
}

# LE/HLE (Aug 2025 vintage) recoded Barnsley / Sheffield after the Dec 2024 BUC file.
GEO_CODE_ALIASES = {
    "E08000016": "E08000038",  # Barnsley
    "E08000019": "E08000039",  # Sheffield
}

ARCGIS = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services"
IOD_URL = (
    "https://assets.publishing.service.gov.uk/media/"
    "6917412ebc34c86ce4e6e7fc/File_10_-_IoD2025_Local_Authority_District_Summaries__lower-tier__v2.xlsx"
)


def nation_of(code: str) -> str:
    if code.startswith("E"):
        return "E"
    if code.startswith("W"):
        return "W"
    if code.startswith("S"):
        return "S"
    if code.startswith("N"):
        return "N"
    if code.startswith("K"):
        return "UK"
    return "?"


def grain_of(code: str, area_type: str) -> str:
    if area_type == "Region":
        return "region"
    if area_type == "Country":
        return "country"
    prefix = code[:3]
    if prefix == "E10":
        return "counties"
    if prefix in {"E06", "E07", "E08", "E09", "N09", "S12", "W06"}:
        return "ltla"
    return "other"


def fetch(url: str, timeout: int = 90) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": "ons-le-explorer/1.0"})
    try:
        with urllib.request.urlopen(req, context=SSL, timeout=timeout) as resp:
            return resp.read()
    except Exception as exc:
        print(f"  download failed {url}: {exc}", file=sys.stderr)
        return None


def load_gzip_json(path: Path) -> dict:
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        return json.load(fh)


def dump_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, separators=(",", ":"), ensure_ascii=False)
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes)")


def pack_le_hle(rows: list[dict], value_key: str, periods: list[str], ages: list[str] | None) -> dict:
    period_index = {p: i for i, p in enumerate(periods)}
    areas: dict[str, dict] = {}
    values: dict[str, dict] = {}
    n_periods = len(periods)

    def empty_series() -> list:
        return [[None, None, None] for _ in range(n_periods)]

    for row in rows:
        code = row["code"]
        if code not in areas:
            areas[code] = {
                "code": code,
                "name": row["name"],
                "nation": nation_of(code),
                "grain": grain_of(code, row["areaType"]),
                "areaType": row["areaType"],
            }
        sex = row["sex"]
        age = row.get("age") or "birth"
        if ages is not None and age not in ages:
            continue
        pi = period_index.get(row["period"])
        if pi is None:
            continue
        node = values.setdefault(code, {}).setdefault(sex, {})
        if ages is None:
            series = node.setdefault("all", empty_series())
        else:
            series = node.setdefault(age, empty_series())
        val = row.get(value_key)
        series[pi] = [
            None if val is None else val,
            row.get("lci"),
            row.get("uci"),
        ]
    return {
        "areas": sorted(areas.values(), key=lambda a: a["code"]),
        "values": values,
    }


def build_le() -> tuple[dict, list[dict]]:
    src = UPLOADS / "le_local_areas_birth_65.json_d90e.gz"
    raw = load_gzip_json(src)
    keep_types = {"Local Areas", "Region", "Country"}
    rows = [r for r in raw["rows"] if r["areaType"] in keep_types]
    periods = raw["meta"]["periods"]
    packed = pack_le_hle(rows, "le", periods, ["birth", "65"])
    payload = {
        "meta": {
            "family": "le",
            "source": raw["meta"]["source"],
            "download": raw["meta"].get("download"),
            "licence": "Open Government Licence v3.0",
            "asOf": "2025-12-10",
            "version": "2022-24",
            "unit": "years",
            "notes": raw["meta"].get("notes", []),
        },
        "periods": periods,
        "sexes": ["Male", "Female"],
        "ages": ["birth", "65"],
        **packed,
    }
    dump_json(OUT_DATA / "le.json", payload)
    return payload, packed["areas"]


def build_hle() -> dict:
    src = UPLOADS / "hle_uk_birth.json_e012.gz"
    raw = load_gzip_json(src)
    keep_types = {"Local Areas", "Region", "Country"}
    rows = [r for r in raw["rows"] if r["areaType"] in keep_types]
    periods = raw["meta"]["periods"]
    packed = pack_le_hle(rows, "hle", periods, ["birth"])
    payload = {
        "meta": {
            "family": "hle",
            "source": raw["meta"]["source"],
            "licence": "Open Government Licence v3.0",
            "asOf": "2026-02-19",
            "version": "2022-24",
            "unit": "years",
            "officialStatisticsInDevelopment": True,
            "notes": raw["meta"].get("notes", []),
        },
        "periods": periods,
        "sexes": ["Male", "Female"],
        "ages": ["birth"],
        **packed,
    }
    dump_json(OUT_DATA / "hle.json", payload)
    return payload


def col_of(ref: str) -> str:
    return "".join(ch for ch in ref if ch.isalpha())


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("m:si", NS):
        texts = [t.text or "" for t in si.findall(".//m:t", NS)]
        out.append("".join(texts))
    return out


def cell_value(cell: ET.Element, shared: list[str]) -> str | float | None:
    ref_type = cell.get("t")
    vnode = cell.find("m:v", NS)
    if vnode is None or vnode.text is None:
        is_node = cell.find("m:is", NS)
        if is_node is not None:
            texts = [t.text or "" for t in is_node.findall(".//m:t", NS)]
            return "".join(texts)
        return None
    raw = vnode.text
    if ref_type == "s":
        return shared[int(raw)]
    if ref_type == "str":
        return raw
    try:
        if "." in raw or "e" in raw.lower():
            return float(raw)
        return int(raw)
    except ValueError:
        return raw


def parse_avoidable_table4(xlsx_path: Path) -> list[dict]:
    """Stream Table_4 (sheet8) without openpyxl — drawings / dimension are unreliable."""
    rows_out: list[dict] = []
    with zipfile.ZipFile(xlsx_path) as zf:
        shared = load_shared_strings(zf)
        xml = zf.read("xl/worksheets/sheet8.xml")
    # iterparse from bytes
    context = ET.iterparse(io.BytesIO(xml), events=("end",))
    current: dict[str, str | float | None] = {}
    row_num = 0
    wanted = {"A", "B", "C", "D", "E", "G", "H", "I"}
    for _event, elem in context:
        tag = elem.tag.rsplit("}", 1)[-1]
        if tag == "c" and col_of(elem.get("r", "")) in wanted:
            col = col_of(elem.get("r", ""))
            current[col] = cell_value(elem, shared)
        elif tag == "row":
            row_num += 1
            if row_num >= 7 and current.get("B") and current.get("E"):
                cond = str(current.get("E") or "")
                if cond in {"Avoidable", "Preventable", "Treatable"}:
                    sex_raw = str(current.get("D") or "")
                    sex = {"Males": "Male", "Females": "Female", "Persons": "Persons"}.get(
                        sex_raw, sex_raw
                    )
                    year = current.get("A")
                    if isinstance(year, (int, float)):
                        year = str(int(year))
                    rows_out.append(
                        {
                            "period": str(year or ""),
                            "code": str(current.get("B") or ""),
                            "name": str(current.get("C") or ""),
                            "sex": sex,
                            "condition": cond.lower(),
                            "rate": current.get("G"),
                            "lci": current.get("H"),
                            "uci": current.get("I"),
                        }
                    )
            current = {}
            elem.clear()
    print(f"  parsed {len(rows_out):,} avoidable Table_4 total rows")
    return rows_out


def build_avoidable() -> dict:
    src = UPLOADS / "avoidable_ew_0d6d.xlsx"
    rows = parse_avoidable_table4(src)
    # Keep E&W local, counties, regions, countries. Drop Scot/NI.
    keep_prefixes = ("E06", "E07", "E08", "E09", "E10", "E12", "W06", "E92", "W92")
    filtered = [
        r
        for r in rows
        if r["code"].startswith(keep_prefixes)
        and r["period"]
        and " to " in r["period"]
    ]
    periods = sorted(set(r["period"] for r in filtered), key=lambda p: int(p[:4]))
    period_index = {p: i for i, p in enumerate(periods)}
    n_periods = len(periods)
    areas: dict[str, dict] = {}
    values: dict = {}

    def empty() -> list:
        return [[None, None, None] for _ in range(n_periods)]

    for row in filtered:
        code = row["code"]
        if code.startswith("E12"):
            grain = "region"
            area_type = "Region"
        elif code.startswith(("E92", "W92")):
            grain = "country"
            area_type = "Country"
        elif code.startswith("E10"):
            grain = "counties"
            area_type = "Local Areas"
        else:
            grain = "ltla"
            area_type = "Local Areas"
        if code not in areas:
            areas[code] = {
                "code": code,
                "name": row["name"],
                "nation": nation_of(code),
                "grain": grain,
                "areaType": area_type,
            }
        pi = period_index[row["period"]]
        series = (
            values.setdefault(code, {})
            .setdefault(row["sex"], {})
            .setdefault(row["condition"], empty())
        )
        series[pi] = [row["rate"], row["lci"], row["uci"]]

    payload = {
        "meta": {
            "family": "avoidable",
            "source": "ONS avoidable mortality in England and Wales: 2001 to 2024 (Table 4, 3-year rolling aggregates)",
            "licence": "Open Government Licence v3.0",
            "asOf": "2026-02-24",
            "version": "2024",
            "unit": "age-standardised rate per 100,000",
            "coverage": "England and Wales only",
            "notes": [
                "ONS avoidable, preventable and treatable mortality in this explorer covers England and Wales only.",
                "Scotland and Northern Ireland publish separate figures — they are not merged into one UK map.",
            ],
        },
        "periods": periods,
        "sexes": ["Male", "Female", "Persons"],
        "conditions": ["avoidable", "preventable", "treatable"],
        "areas": sorted(areas.values(), key=lambda a: a["code"]),
        "values": values,
    }
    dump_json(OUT_DATA / "avoidable.json", payload)
    print(f"  avoidable areas {len(areas)} periods {len(periods)}")
    return payload


def xlsx_sheet_rows(data: bytes, sheet_name: str) -> list[list]:
    zf = zipfile.ZipFile(io.BytesIO(data))
    shared = load_shared_strings(zf)
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {}
    for rel in rels:
        rid_to_target[rel.get("Id")] = rel.get("Target")
    ns_r = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
    sheet_path = None
    for sh in wb.findall("m:sheets/m:sheet", NS):
        if sh.get("name") == sheet_name:
            target = rid_to_target[sh.get(f"{ns_r}id")]
            sheet_path = "xl/" + target.lstrip("/")
            if not sheet_path.startswith("xl/"):
                sheet_path = "xl/" + target
            if target.startswith("/"):
                sheet_path = target.lstrip("/")
            elif target.startswith("worksheets"):
                sheet_path = "xl/" + target
            break
    if not sheet_path:
        raise RuntimeError(f"sheet {sheet_name} not found")
    xml = zf.read(sheet_path)
    rows: list[list] = []
    current: dict[str, object] = {}
    max_col = 0
    letters = []
    for _event, elem in ET.iterparse(io.BytesIO(xml), events=("end",)):
        tag = elem.tag.rsplit("}", 1)[-1]
        if tag == "c":
            col = col_of(elem.get("r", ""))
            current[col] = cell_value(elem, shared)
            if col not in letters:
                letters.append(col)
            max_col = max(max_col, len(col))
        elif tag == "row":
            # order columns A, B, C...
            ordered = []
            for i in range(1, 40):
                name = ""
                n = i
                while n:
                    n, rem = divmod(n - 1, 26)
                    name = chr(65 + rem) + name
                if name in current:
                    ordered.append(current[name])
                elif current:
                    # stop once past last filled? keep going a bit
                    ordered.append(None)
                else:
                    break
            # trim trailing Nones
            while ordered and ordered[-1] is None:
                ordered.pop()
            if ordered:
                rows.append(ordered)
            current = {}
            elem.clear()
    return rows


def build_iod() -> dict | None:
    print("  downloading IoD25 File 10…")
    data = fetch(IOD_URL)
    if not data:
        # Parse the already-fetched markdown table as a last resort.
        if IOD_MARKDOWN.exists():
            return parse_iod_markdown(IOD_MARKDOWN)
        return None
    rows = xlsx_sheet_rows(data, "IMD")
    header = [str(h or "").strip() for h in rows[0]]
    # Find code / name / rank of average score
    def find_col(*needles: str) -> int:
        for i, h in enumerate(header):
            hl = h.lower()
            if all(n.lower() in hl for n in needles):
                return i
        raise KeyError(needles)

    try:
        i_code = find_col("code")
        i_name = find_col("name")
        i_rank = find_col("rank of average score")
        i_score = find_col("average score")
        i_prop = find_col("proportion of lsoas")
    except KeyError as exc:
        print("  IoD columns missing", header[:12], exc)
        return None
    areas = []
    values = {}
    for row in rows[1:]:
        if not row or not row[i_code]:
            continue
        code = str(row[i_code]).strip()
        if not code.startswith("E"):
            continue
        name = str(row[i_name]).strip()
        rank = row[i_rank]
        score = row[i_score]
        prop = row[i_prop]
        code = GEO_CODE_ALIASES.get(code, code)
        areas.append(
            {
                "code": code,
                "name": name,
                "nation": "E",
                "grain": "ltla" if not code.startswith("E10") else "counties",
                "areaType": "Local Areas",
            }
        )
        values[code] = {
            "rankAverageScore": rank,
            "averageScore": score,
            "propMostDeprived10": prop,
        }
    payload = {
        "index": "IoD25 File 10 (lower-tier LAD)",
        "asOf": "2025-11-17",
        "licence": "Open Government Licence v3.0",
        "source": "English indices of deprivation 2025, File 10 v2",
        "url": "https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025",
        "note": "Rank of average IMD score; 1 = most deprived in England. Not comparable with WIMD.",
        "higherRankIsLessDeprived": True,
        "areas": areas,
        "values": values,
    }
    print(f"  IoD areas {len(areas)}")
    return payload


def parse_iod_markdown(path: Path) -> dict | None:
    areas = []
    values = {}
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            if not line.startswith("| E"):
                continue
            parts = [p.strip() for p in line.strip().strip("|").split("|")]
            if len(parts) < 7:
                continue
            code, name = parts[0], parts[1]
            try:
                rank = float(parts[5])
                score = float(parts[4])
                prop = float(parts[6])
            except ValueError:
                continue
            areas.append(
                {
                    "code": code,
                    "name": name,
                    "nation": "E",
                    "grain": "ltla",
                    "areaType": "Local Areas",
                }
            )
            values[code] = {
                "rankAverageScore": rank,
                "averageScore": score,
                "propMostDeprived10": prop,
            }
    if not areas:
        return None
    return {
        "index": "IoD25 File 10 (lower-tier LAD)",
        "asOf": "2025-11-17",
        "licence": "Open Government Licence v3.0",
        "source": "English indices of deprivation 2025, File 10 v2",
        "url": "https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025",
        "note": "Rank of average IMD score; 1 = most deprived in England. Not comparable with WIMD.",
        "higherRankIsLessDeprived": True,
        "areas": areas,
        "values": values,
    }


def try_wimd() -> dict | None:
    """WIMD 2025 local-authority profiles are not bundled."""
    return None


def build_deprivation() -> dict:
    iod = build_iod()
    wimd = try_wimd()
    payload = {
        "meta": {
            "family": "deprivation",
            "licence": "Open Government Licence v3.0",
            "asOf": "2025",
            "notes": [
                "Each UK nation has its own deprivation index. Ranks and scores aren't comparable across nations — there isn't a single UK deprivation league table.",
                "Deprivation is shown as context, not as an explanation. Many factors sit behind differences in life expectancy.",
            ],
        },
        "england": iod,
        "wales": wimd,
        "scotland": None,
        "northernIreland": None,
    }
    dump_json(OUT_DATA / "deprivation.json", payload)
    return payload


def round_coords(geom: dict, ndigits: int = 3) -> dict:
    def walk(obj):
        if isinstance(obj, list):
            if obj and isinstance(obj[0], (int, float)):
                return [round(float(obj[0]), ndigits), round(float(obj[1]), ndigits)]
            return [walk(x) for x in obj]
        return obj

    return {"type": geom["type"], "coordinates": walk(geom["coordinates"])}


def arcgis_geojson(service: str, fields: str) -> dict | None:
    features = []
    offset = 0
    while True:
        url = (
            f"{ARCGIS}/{service}/FeatureServer/0/query"
            f"?where=1%3D1&outFields={fields}&outSR=4326&f=geojson"
            f"&resultOffset={offset}&resultRecordCount=2000"
            f"&geometryPrecision=3"
        )
        print(f"  geo {service} offset {offset}")
        raw = fetch(url, timeout=120)
        if not raw:
            return None if not features else {"type": "FeatureCollection", "features": features}
        try:
            fc = json.loads(raw)
        except json.JSONDecodeError:
            print("  not json", raw[:200])
            return None
        batch = fc.get("features") or []
        features.extend(batch)
        if len(batch) < 2000:
            break
        offset += 2000
    return {"type": "FeatureCollection", "features": features}


def slim_features(fc: dict, code_keys: list[str], name_keys: list[str], keep_codes: set[str] | None) -> dict:
    out = []
    for feat in fc.get("features", []):
        props = feat.get("properties") or {}
        code = None
        name = None
        for k in code_keys:
            if props.get(k):
                code = props[k]
                break
        for k in name_keys:
            if props.get(k):
                name = props[k]
                break
        if not code:
            continue
        mapped = GEO_CODE_ALIASES.get(code, code)
        if keep_codes is not None and mapped not in keep_codes and code not in keep_codes:
            continue
        code = mapped if keep_codes is None or mapped in keep_codes else code
        geom = feat.get("geometry")
        if not geom:
            continue
        out.append(
            {
                "type": "Feature",
                "properties": {"code": code, "name": name},
                "geometry": round_coords(geom, 3),
            }
        )
    return {"type": "FeatureCollection", "features": out}


def build_geo(le_areas: list[dict], hle_areas: list[dict]) -> None:
    OUT_GEO.mkdir(parents=True, exist_ok=True)
    le_codes = {a["code"] for a in le_areas}
    hle_codes = {a["code"] for a in hle_areas}
    ltla_codes = {c for c in le_codes if grain_of(c, "Local Areas") == "ltla"}
    county_codes = {c for c in le_codes if c.startswith("E10")}
    region_codes = {c for c in le_codes if c.startswith("E12")}
    utla_codes = {
        c
        for c in hle_codes
        if c[:3] in {"E06", "E08", "E09", "E10", "N09", "S12", "W06"}
    }

    lad = arcgis_geojson(
        "Local_Authority_Districts_December_2024_Boundaries_UK_BUC",
        "LAD24CD,LAD24NM",
    )
    ctyua = arcgis_geojson(
        "Counties_and_Unitary_Authorities_December_2024_Boundaries_UK_BUC",
        "CTYUA24CD,CTYUA24NM",
    )
    regions = arcgis_geojson(
        "Regions_December_2023_Boundaries_EN_BUC",
        "RGN23CD,RGN23NM",
    )
    if regions is None:
        regions = arcgis_geojson(
            "Regions_December_2022_EN_BUC",
            "RGN22CD,RGN22NM",
        )

    if lad:
        slim = slim_features(lad, ["LAD24CD", "LAD23CD", "code"], ["LAD24NM", "LAD23NM", "name"], ltla_codes)
        dump_json(OUT_GEO / "ltla.geojson", slim)
        print(f"  ltla features {len(slim['features'])} / {len(ltla_codes)}")
    else:
        print("  WARNING: LAD boundaries missing")

    if ctyua:
        counties = slim_features(
            ctyua, ["CTYUA24CD", "CTYUA23CD", "code"], ["CTYUA24NM", "name"], county_codes
        )
        dump_json(OUT_GEO / "counties.geojson", counties)
        utla = slim_features(
            ctyua, ["CTYUA24CD", "CTYUA23CD", "code"], ["CTYUA24NM", "name"], utla_codes
        )
        dump_json(OUT_GEO / "utla.geojson", utla)
        print(f"  counties {len(counties['features'])} utla {len(utla['features'])}")
    else:
        print("  WARNING: CTYUA boundaries missing")

    if regions:
        rslim = slim_features(
            regions, ["RGN23CD", "RGN22CD", "RGN24CD", "code"], ["RGN23NM", "RGN22NM", "name"], region_codes
        )
        dump_json(OUT_GEO / "regions.geojson", rslim)
        print(f"  regions {len(rslim['features'])}")
    else:
        print("  WARNING: region boundaries missing")


def build_lookups(le_areas: list[dict], hle_areas: list[dict]) -> dict:
    name_to_utla = {a["name"]: a for a in hle_areas if a["code"].startswith("E10")}
    name_to_district = {
        a["name"]: a for a in le_areas if a["code"].startswith("E07")
    }
    district_to_utla = {}
    unmatched = []
    for county_code, district_names in COUNTY_DISTRICTS.items():
        county = next((a for a in le_areas if a["code"] == county_code), None)
        if not county:
            continue
        for dname in district_names:
            dist = name_to_district.get(dname)
            if not dist:
                unmatched.append(dname)
                continue
            district_to_utla[dist["code"]] = {
                "code": county["code"],
                "name": county["name"],
            }
    # Unitaries map to themselves for HLE
    for a in le_areas:
        if a["code"][:3] in {"E06", "E08", "E09", "N09", "S12", "W06"}:
            district_to_utla.setdefault(
                a["code"], {"code": a["code"], "name": a["name"]}
            )

    payload = {
        "districtToUtla": district_to_utla,
        "geoCodeAliases": GEO_CODE_ALIASES,
        "unmatchedDistricts": unmatched,
        "excludedFromLocalSeries": [
            {"code": "E06000053", "name": "Isles of Scilly"},
            {"code": "E09000001", "name": "City of London"},
        ],
        "notes": [
            "Isles of Scilly and City of London are omitted from ONS local LE/HLE series.",
        ],
    }
    dump_json(OUT_DATA / "lookups.json", payload)
    print(
        f"  district→UTLA {len([k for k in district_to_utla if k.startswith('E07')])} "
        f"unmatched {unmatched}"
    )
    return payload


def main() -> None:
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    print("LE")
    le, le_areas = build_le()
    print("HLE")
    hle = build_hle()
    print("Avoidable")
    build_avoidable()
    print("Deprivation")
    build_deprivation()
    print("Lookups")
    build_lookups(le["areas"], hle["areas"])
    print("Geo")
    build_geo(le["areas"], hle["areas"])
    manifest = {
        "version": "v1",
        "licence": "Open Government Licence v3.0",
        "attribution": "Source: Office for National Statistics, licensed under the Open Government Licence v3.0. Boundaries: ONS Open Geography (contains OS data © Crown copyright and database right).",
        "files": {
            "le": "/data/le.json",
            "hle": "/data/hle.json",
            "avoidable": "/data/avoidable.json",
            "deprivation": "/data/deprivation.json",
            "lookups": "/data/lookups.json",
        },
        "geo": {
            "ltla": "/geo/ltla.geojson",
            "counties": "/geo/counties.geojson",
            "utla": "/geo/utla.geojson",
            "regions": "/geo/regions.geojson",
        },
    }
    dump_json(OUT_DATA / "manifest.json", manifest)
    print("done")


if __name__ == "__main__":
    main()
