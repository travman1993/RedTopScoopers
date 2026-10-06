#!/usr/bin/env python3
"""Check a Cleanup Challenge reward code and see which discount it was issued for.

    python3 tools/verify_code.py SCOOP-7K42X

Codes carry two check characters tied to the discount level (see makeCode in
js/egg.js), so an edited screenshot (e.g. a 5% code relabeled as 20%) won't
verify. This catches casual tampering only — the logic is in public JS, so it
is not real security. Keep SALT in sync with CODE_SALT in js/egg.js.
"""
import re
import sys

SALT = "rts-landfill-2026"
ALPH = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
TIERS = (5, 10, 15, 20)


def fnv1a(s):
    h = 0x811C9DC5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def verify(code):
    m = re.fullmatch(r"([A-Z]+)-(.)(.)(.)(.)(.)", code.strip().upper())
    if not m:
        return None
    prefix, r0, c0, r1, r2, c1 = m.groups()
    for pct in TIERS:
        h = fnv1a(f"{prefix}|{r0}{r1}{r2}|{pct}|{SALT}")
        if ALPH[h % 31] == c0 and ALPH[(h // 31) % 31] == c1:
            return pct
    return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    for code in sys.argv[1:]:
        pct = verify(code)
        print(f"{code}: " + (f"VALID — {pct}% off" if pct else "NOT VALID"))
