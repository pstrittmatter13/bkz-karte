"""Gemeinde- und Ländergrenzen für die Karte vorbereiten.

Quelle: © BKG (2026) dl-de/by-2-0, VG250-EW, Gebietsstand 31.12.2025 (Ebenen, GeoPackage, UTM32s / EPSG:25832),
Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0).
Download: https://daten.gdz.bkg.bund.de/produkte/vg/vg250-ew_ebenen_1231/aktuell/vg250-ew_12-31.utm32s.gpkg.ebenen.zip

Das GeoPackage ist eine SQLite-Datei; gelesen ohne GDAL (sqlite3 + shapely).
Koordinaten bleiben in UTM32 (Meter); die Seite zeichnet sie eben (d3.geoIdentity) – keine Umprojektion nötig.
Vereinfachung mit shapely.coverage_simplify: Nachbargemeinden behalten gemeinsame Grenzen (keine Lücken).

Aufruf:  python src/gemeinden.py rohdaten/vg250/vg250-ew_ebenen_1231/DE_VG250.gpkg
Ausgabe: data/gemeinden.geojson, data/laender.geojson (Koordinaten in km, 2 Nachkommastellen = 10 m)
"""
import json
import os
import sqlite3
import struct
import sys

import shapely
from shapely import wkb

TOLERANZ_M = 400   # Vereinfachung in Metern (Deutschlandkarte; Zoom bis Gemeinde)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def gpkg_geom(blob):
    """GeoPackage-Binärformat: Kopf 'GP', Version, Flags, SRS-ID, Hüllrechteck, dann WKB."""
    flags = blob[3]
    env = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(flags >> 1) & 0b111]
    return wkb.loads(bytes(blob[8 + env:]))


def lies(con, tabelle, felder):
    gcol = con.execute("select column_name from gpkg_geometry_columns where table_name=?", (tabelle,)).fetchone()[0]
    rows = con.execute(f"select {','.join(felder)},{gcol} from {tabelle}").fetchall()
    return [dict(zip(felder, r[:-1])) for r in rows], [gpkg_geom(r[-1]) for r in rows]


def koord(c):
    if isinstance(c[0], (int, float)):
        return [round(c[0] / 1000, 2), round(c[1] / 1000, 2)]
    return [koord(x) for x in c]


def schreibe(props, geoms, ziel):
    feats = []
    for p, g in zip(props, geoms):
        if g is None or g.is_empty:
            continue
        gi = dict(g.__geo_interface__)
        feats.append({"type": "Feature", "properties": p,
                      "geometry": {"type": gi["type"], "coordinates": koord(gi["coordinates"])}})
    with open(ziel, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": feats}, f, ensure_ascii=False, separators=(",", ":"))
    print(ziel, len(feats), f"{os.path.getsize(ziel) / 1e6:.1f} MB")


con = sqlite3.connect(sys.argv[1])
os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)

# Gemeinden, nur Landflächen (GF = 4); je AGS zusammenfassen (Exklaven)
p, g = lies(con, "vg250_gem", ["AGS", "GEN", "EWZ", "GF"])
gem = {}
for pp, gg in zip(p, g):
    if pp["GF"] != 4:
        continue
    e = gem.setdefault(pp["AGS"], {"ags": pp["AGS"], "name": pp["GEN"], "ew": int(pp["EWZ"] or 0), "g": []})
    e["g"].append(gg)
ags = sorted(gem)
geoms = [shapely.union_all(gem[a]["g"]) for a in ags]
geoms = list(shapely.coverage_simplify(geoms, TOLERANZ_M))
schreibe([{k: gem[a][k] for k in ("ags", "name", "ew")} for a in ags], geoms,
         os.path.join(ROOT, "data", "gemeinden.geojson"))

# Länder
p, g = lies(con, "vg250_lan", ["AGS", "GEN", "GF"])
lan = {}
for pp, gg in zip(p, g):
    if pp["GF"] == 4:
        lan.setdefault(pp["AGS"], {"name": pp["GEN"], "g": []})["g"].append(gg)
la = sorted(lan)
lg = list(shapely.coverage_simplify([shapely.union_all(lan[a]["g"]) for a in la], TOLERANZ_M * 3))
schreibe([{"ags": a, "name": lan[a]["name"]} for a in la], lg, os.path.join(ROOT, "data", "laender.geojson"))
