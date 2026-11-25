"""HS-Betreiber für Gemeinden ohne MaStR-Zuordnung bei VNBdigital abfragen.

Aufruf:  PYTHONPATH=_pylib python src/vnbdigital_abfrage.py [max_anzahl]
Ablauf:  1. Gemeinden ohne HS-Zuordnung aus data/karte.json, die noch nicht in zuordnung_vnbdigital.csv stehen.
         2. Je Gemeinde ein Punkt sicher innerhalb der Fläche (shapely point_on_surface), UTM32 -> WGS84.
         3. Abfrage auf vnbdigital.de (dieselbe Schnittstelle wie die Kartensuche der Seite), Filter Spannungsbereich
            „Hochspannung“; höchstens 1 Abfrage je Sekunde.
         4. Jede Antwort roh nach rohdaten/vnbdigital_api.jsonl (fortsetzbar: bereits abgefragte AGS werden übersprungen),
            Ergebnis in zuordnung_vnbdigital.csv ergänzt (Spalte punkt = abgefragte Koordinate).
Danach src/baue_karte.py neu laufen lassen.
"""
import csv
import json
import math
import os
import sys
import time
import urllib.request
from datetime import date

import shapely
from shapely.geometry import shape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROH = os.path.join(ROOT, "rohdaten", "vnbdigital_api.jsonl")
ZIEL = os.path.join(ROOT, "zuordnung_vnbdigital.csv")
URL = "https://www.vnbdigital.de/gateway/graphql"
FILTER = "eyJvbmx5TmFwIjpmYWxzZSwidm9sdGFnZVR5cGVzIjpbIkhvY2hzcGFubnVuZyJdLCJ3aXRoUmVnaW9ucyI6ZmFsc2V9"
QUERY = ("query ($c: String) { vnb_coordinates(coordinates: $c) { vnbs(filter: {onlyNap: false, "
         "voltageTypes: [Hochspannung], withRegions: false}) { _id name types voltageTypes } } }")
SPALTEN = ["ags", "gemeinde", "kreis", "hs_betreiber", "mastr_nr", "abruf", "vnbdigital_url", "punkt"]


def utm32_wgs84(e, n):
    """ETRS89/UTM Zone 32N (Meter) -> Breite, Länge in Grad (Krüger-Reihen, Genauigkeit < 1 mm)."""
    a, f = 6378137.0, 1 / 298.257222101
    k0, e0, lon0 = 0.9996, 500000.0, math.radians(9)
    nn = f / (2 - f)
    A = a / (1 + nn) * (1 + nn ** 2 / 4 + nn ** 4 / 64)
    beta = [nn / 2 - 2 * nn ** 2 / 3 + 37 * nn ** 3 / 96, nn ** 2 / 48 + nn ** 3 / 15, 17 * nn ** 3 / 480]
    delta = [2 * nn - 2 * nn ** 2 / 3 - 2 * nn ** 3, 7 * nn ** 2 / 3 - 8 * nn ** 3 / 5, 56 * nn ** 3 / 15]
    xi, eta = n / (k0 * A), (e - e0) / (k0 * A)
    xi_, eta_ = xi, eta
    for j, b in enumerate(beta, 1):
        xi_ -= b * math.sin(2 * j * xi) * math.cosh(2 * j * eta)
        eta_ -= b * math.cos(2 * j * xi) * math.sinh(2 * j * eta)
    chi = math.asin(math.sin(xi_) / math.cosh(eta_))
    lat = chi + sum(d * math.sin(2 * j * chi) for j, d in enumerate(delta, 1))
    lon = lon0 + math.atan(math.sinh(eta_) / math.cos(xi_))
    return math.degrees(lat), math.degrees(lon)


def lies_csv(p):
    if not os.path.isfile(p):
        return {}
    with open(p, encoding="utf-8-sig", newline="") as f:
        return {r["ags"]: r for r in csv.DictReader(f, delimiter=";")}


def main():
    maxn = int(sys.argv[1]) if len(sys.argv) > 1 else 10 ** 6
    K = json.load(open(os.path.join(ROOT, "data", "karte.json"), encoding="utf-8"))
    G = json.load(open(os.path.join(ROOT, "data", "gemeinden.geojson"), encoding="utf-8"))
    vorhanden = lies_csv(ZIEL)
    erledigt = set()
    if os.path.isfile(ROH):
        erledigt = {json.loads(z)["ags"] for z in open(ROH, encoding="utf-8") if z.strip()}
    offen = [f for f in G["features"]
             if "hs" not in K["gem"].get(f["properties"]["ags"], {}) or K["gem"][f["properties"]["ags"]]["hs"][3] == "VNBdigital"]
    offen = [f for f in offen if f["properties"]["ags"] not in vorhanden and f["properties"]["ags"] not in erledigt][:maxn]
    print(f"{len(offen)} Gemeinden abzufragen")
    with open(ROH, "a", encoding="utf-8") as roh:
        for i, f in enumerate(offen, 1):
            p = shapely.point_on_surface(shape(f["geometry"]))
            lat, lon = utm32_wgs84(p.x * 1000, p.y * 1000)       # Kartendaten in km
            c = f"{lat:.5f},{lon:.5f}"
            body = json.dumps({"query": QUERY, "variables": {"c": c}}).encode()
            req = urllib.request.Request(URL, body, {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (BKZ-Karte, Forschung)"})
            for versuch in range(3):
                try:
                    antwort = json.load(urllib.request.urlopen(req, timeout=30))
                    break
                except Exception as ex:          # Netzfehler: kurz warten, erneut
                    antwort = {"fehler": str(ex)}
                    time.sleep(5)
            roh.write(json.dumps({"ags": f["properties"]["ags"], "name": f["properties"]["name"], "punkt": c,
                                  "abruf": date.today().isoformat(), "antwort": antwort}, ensure_ascii=False) + "\n")
            roh.flush()
            if i % 100 == 0:
                print(i, "abgefragt", flush=True)
            time.sleep(1.0)
    uebernehmen()


def uebernehmen():
    """Rohantworten -> zuordnung_vnbdigital.csv (Gemeinden aus der Browser-Abfrage bleiben unverändert)."""
    mastr = {}
    with open(os.path.join(ROOT, "data", "mastr_netzbetreiber.csv"), encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            mastr.setdefault(" ".join(r["name"].replace("＆", "&").lower().split()), r["mastr_nr"])
    zeilen = lies_csv(ZIEL)
    ohne_nr, fehler = set(), []
    for z in open(ROH, encoding="utf-8"):
        r = json.loads(z)
        if r["ags"] in zeilen and not zeilen[r["ags"]].get("punkt"):
            continue                              # aus der Browser-Abfrage (mit communityId) – bleibt
        try:
            vnbs = r["antwort"]["data"]["vnb_coordinates"]["vnbs"]
        except (KeyError, TypeError):
            fehler.append(r["name"])
            continue
        namen = [v["name"] for v in vnbs if "Hochspannung" in (v.get("voltageTypes") or [])]
        nrs = [mastr.get(" ".join(n.replace("＆", "&").lower().split()), "") for n in namen]
        ohne_nr |= {n for n, x in zip(namen, nrs) if not x}
        zeilen[r["ags"]] = {"ags": r["ags"], "gemeinde": r["name"], "kreis": "", "hs_betreiber": "|".join(namen),
                            "mastr_nr": "|".join(nrs), "abruf": r["abruf"], "punkt": r["punkt"],
                            "vnbdigital_url": f"https://www.vnbdigital.de/overview?filter={FILTER}&coordinates={r['punkt']}"}
    with open(ZIEL, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, SPALTEN, delimiter=";")
        w.writeheader()
        for k in sorted(zeilen):
            w.writerow({s: zeilen[k].get(s, "") for s in SPALTEN})
    v = list(zeilen.values())
    print(f"{len(v)} Gemeinden in zuordnung_vnbdigital.csv: {sum(1 for r in v if r['hs_betreiber'] and '|' not in r['hs_betreiber'])} "
          f"mit einem HS-Betreiber, {sum(1 for r in v if '|' in r['hs_betreiber'])} mit mehreren, {sum(1 for r in v if not r['hs_betreiber'])} ohne")
    if fehler:
        print("Abfrage fehlgeschlagen:", ", ".join(fehler[:30]), "…" if len(fehler) > 30 else "")
    if ohne_nr:
        print("Ohne MaStR-Nummer (Name nicht im MaStR gefunden):", "; ".join(sorted(ohne_nr)))


if __name__ == "__main__":
    main()
