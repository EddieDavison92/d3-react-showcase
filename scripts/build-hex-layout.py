#!/usr/bin/env python3
"""Build public/data/hex.json from the Open Innovations LAD hex map (MIT).

Source: https://github.com/odileeds/hexmaps (uk-local-authority-districts-2023).
Output: {"layout": "odd-r", "hexes": {code: [q, r]}} keyed by ONS 2024 codes.
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://raw.githubusercontent.com/odileeds/hexmaps/gh-pages/maps/uk-local-authority-districts-2023.hexjson"
OUT = ROOT / "public" / "data" / "hex.json"
# The hex map predates the 2024 Barnsley and Sheffield recodes.
CODE_ALIASES = {"E08000016": "E08000038", "E08000019": "E08000039"}

with urllib.request.urlopen(URL, timeout=60) as res:
    source = json.loads(res.read().decode("utf-8"))

hexes = {
    CODE_ALIASES.get(code, code): [cell["q"], cell["r"]]
    for code, cell in source["hexes"].items()
}
OUT.write_text(
    json.dumps({"layout": source["layout"], "hexes": hexes}, separators=(",", ":")),
    encoding="utf-8",
)
print(f"wrote {OUT.relative_to(ROOT)} ({len(hexes)} hexes)")
