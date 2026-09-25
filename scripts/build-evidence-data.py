#!/usr/bin/env python3
"""Build public/data/evidence.json from OHID Fingertips (England only).

Pulls one latest value per area for each indicator below, at lower-tier
(districts and unitaries) and upper-tier (counties and unitaries) geography.
Raw CSVs are cached in .cache/ft; delete that folder to refresh.
"""

from __future__ import annotations

import csv
import json
import sys
from collections import Counter
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "ft"
OUT = ROOT / "public" / "data" / "evidence.json"
API = (
    "https://fingertips.phe.org.uk/api/all_data/csv/by_indicator_id"
    "?indicator_ids={id}&child_area_type_id={area_type}&parent_area_type_id=15"
)
AREA_TYPES = {"ltla": 501, "utla": 502}
ENGLAND = "E92000001"
# Fingertips still uses pre-2024 codes for Barnsley and Sheffield.
CODE_ALIASES = {"E08000016": "E08000038", "E08000019": "E08000039"}
# Share of areas that must have a value before a period counts as "latest".
MIN_COVERAGE = 0.9

# better: which direction is good for health ("low" = lower values are better).
# range: preferred Fingertips time-period range when several share an end year.
INDICATORS = [
    # Behaviour
    dict(key="smoking", short="Smoking", id=92443, group="Behaviour", label="Adults who smoke",
         unit="%", better="low", decimals=1),
    dict(key="obesity", short="Obesity", id=93881, group="Behaviour", label="Adults living with obesity",
         unit="%", better="low", decimals=1),
    dict(key="inactive", short="Physical inactivity", id=93015, group="Behaviour", label="Physically inactive adults",
         unit="%", better="low", decimals=1),
    dict(key="alcohol", short="Alcohol admissions", id=92906, group="Behaviour",
         label="Alcohol-specific hospital admissions", unit="per 100,000",
         better="low", decimals=0),
    # Economy
    dict(key="imd", short="Deprivation score", id=94240, group="Economy", label="Deprivation score (IMD 2025)",
         unit="score", better="low", decimals=1),
    dict(key="childPoverty", short="Child poverty", id=93701, group="Economy",
         label="Children in absolute low-income families", unit="%", better="low",
         decimals=1),
    dict(key="unemployment", short="Unemployment", id=91126, group="Economy", label="Unemployment",
         unit="%", better="low", decimals=1),
    dict(key="fuelPoverty", short="Fuel poverty", id=93759, group="Economy", label="Households in fuel poverty",
         unit="%", better="low", decimals=1),
    # Environment
    dict(key="airPollution", short="Air pollution deaths", id=93861, group="Environment",
         label="Deaths attributable to fine particulate air pollution", unit="%",
         better="low", decimals=1),
    # Early deaths (under 75, age-standardised)
    dict(key="u75Cvd", short="Cardiovascular, under 75", id=40401, group="Early deaths",
         label="Under-75 deaths from cardiovascular disease", unit="per 100,000",
         better="low", decimals=0, range="3y"),
    dict(key="u75Cancer", short="Cancer, under 75", id=40501, group="Early deaths",
         label="Under-75 deaths from cancer", unit="per 100,000", better="low",
         decimals=0, range="3y"),
    dict(key="u75Resp", short="Respiratory, under 75", id=40701, group="Early deaths",
         label="Under-75 deaths from respiratory disease", unit="per 100,000",
         better="low", decimals=0, range="3y"),
    dict(key="u75Liver", short="Liver disease, under 75", id=40601, group="Early deaths",
         label="Under-75 deaths from liver disease", unit="per 100,000",
         better="low", decimals=0, range="3y"),
    dict(key="drugDeaths", short="Drug misuse", id=92432, group="Early deaths",
         label="Deaths from drug misuse", unit="per 100,000", better="low",
         decimals=1, coverage=0.8),
    dict(key="suicide", short="Suicide", id=41001, group="Early deaths", label="Suicide rate",
         unit="per 100,000", better="low", decimals=1),
]


def fetch(indicator_id: int, area_type: int) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{indicator_id}_{area_type}.csv"
    if not path.exists() or path.stat().st_size < 1000:
        url = API.format(id=indicator_id, area_type=area_type)
        print(f"  fetch {indicator_id} @ {area_type}", file=sys.stderr)
        with urllib.request.urlopen(url, timeout=300) as res:
            path.write_bytes(res.read())
    return path


def is_local(code: str) -> bool:
    return code[:3] in {"E06", "E07", "E08", "E09", "E10"}


def headline_rows(path: Path) -> list[dict]:
    """Persons (or sex-less) rows with no inequality breakdown."""
    rows = []
    with path.open(encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            if row["Category Type"]:
                continue
            if row["Sex"] not in {"Persons", "Not applicable"}:
                continue
            rows.append(row)
    # England rows also carry age bands; keep the headline age local areas use.
    ages = Counter(r["Age"] for r in rows if is_local(r["Area Code"]))
    headline_age = ages.most_common(1)[0][0]
    return [r for r in rows if r["Age"] == headline_age]


def pick_period(
    rows: list[dict], preferred_range: str | None, min_coverage: float
) -> tuple[str, str]:
    """Latest period with enough local coverage; returns (period, range)."""
    local_codes = {r["Area Code"] for r in rows if is_local(r["Area Code"])}
    by_period: dict[tuple[str, str], dict] = {}
    for row in rows:
        key = (row["Time period"], row["Time period range"])
        slot = by_period.setdefault(key, {"sort": row["Time period Sortable"], "n": 0})
        if is_local(row["Area Code"]) and row["Value"]:
            slot["n"] += 1
    candidates = [
        (slot["sort"], key[1] == preferred_range, key)
        for key, slot in by_period.items()
        if local_codes and slot["n"] >= min_coverage * len(local_codes)
    ]
    if not candidates:
        raise SystemExit("no period with enough coverage")
    # Sortable encodes the start year, so a 3-year window sorts behind a single
    # year with the same end. Compare end years instead.
    candidates.sort(key=lambda c: (end_year(c[2][0]), c[1], c[0]))
    return candidates[-1][2]


def end_year(period: str) -> int:
    """'2024' -> 2024, '2024/25' -> 2025, '2022 - 24' -> 2024."""
    start = int(period[:4])
    if "/" in period:
        return start + 1
    if "-" in period:
        return start // 100 * 100 + int(period.split("-")[-1].strip()[-2:])
    return start


def build() -> dict:
    out = {
        "meta": {
            "source": "OHID Fingertips (Public Health Profiles)",
            "url": "https://fingertips.phe.org.uk/",
            "licence": "Open Government Licence v3.0",
            "fetched": date.today().isoformat(),
            "coverage": "England only",
        },
        "indicators": [],
        "england": {},
        "ltla": {},
        "utla": {},
        # Values OHID marks with a data quality issue, by grain, area and key.
        "flags": {"ltla": {}, "utla": {}},
    }
    cached = []
    for spec in INDICATORS:
        entry = {k: v for k, v in spec.items() if k not in {"range", "coverage"}}
        periods = {}
        for grain, area_type in AREA_TYPES.items():
            path = fetch(spec["id"], area_type)
            cached.append(path)
            rows = headline_rows(path)
            period, period_range = pick_period(
                rows, spec.get("range"), spec.get("coverage", MIN_COVERAGE)
            )
            periods[grain] = period
            for row in rows:
                if (row["Time period"], row["Time period range"]) != (period, period_range):
                    continue
                if not row["Value"]:
                    continue
                code = CODE_ALIASES.get(row["Area Code"], row["Area Code"])
                value = round(float(row["Value"]), spec["decimals"] + 1)
                if code == ENGLAND:
                    if grain != "ltla":
                        continue
                    out["england"][spec["key"]] = value
                elif is_local(code):
                    out[grain].setdefault(code, {})[spec["key"]] = value
                    if "data quality" in row["Value note"].lower():
                        out["flags"][grain].setdefault(code, []).append(spec["key"])
        # "2023 - 25" -> "2023–25" for display.
        entry["period"] = periods["ltla"].replace(" - ", "–")
        entry["url"] = f"https://fingertips.phe.org.uk/search/{spec['id']}"
        out["indicators"].append(entry)
        print(
            f"{spec['key']:<14} {periods['ltla']:<10} "
            f"ltla={sum(spec['key'] in v for v in out['ltla'].values())} "
            f"utla={sum(spec['key'] in v for v in out['utla'].values())}",
            file=sys.stderr,
        )
    # Date of the oldest cached download, so a rebuild from cache keeps the real fetch date.
    out["meta"]["fetched"] = date.fromtimestamp(min(p.stat().st_mtime for p in cached)).isoformat()
    return out


if __name__ == "__main__":
    data = build()
    OUT.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)", file=sys.stderr)
