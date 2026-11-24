"""Netzbetreiber je Gemeinde und Spannungsebene aus dem Marktstammdatenregister (MaStR) ableiten.

Quelle: Bundesnetzagentur, Marktstammdatenregister, Gesamtdatenexport (täglich),
Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0). https://www.marktstammdatenregister.de/MaStR/Datendownload

Weg (alles aus dem Export, keine weiteren Quellen):
  Netzanschlusspunkte_*.xml : Lokation -> (Netzbetreiber-MaStR-Nr., Spannungsebene)
  Einheiten*.xml            : Einheit -> (Lokation, Gemeindeschlüssel, Betriebsstatus)
  gezählt wird je Gemeinde, Spannungsebene und Netzbetreiber die Zahl der Einheiten in Betrieb (Status 35),
  deren Netzanschlusspunkt auf dieser Ebene bei diesem Netzbetreiber liegt.

Aufruf:  python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip
Ausgabe: data/mastr_zaehlung.csv  (ags;ebene;mastr_nr;anzahl)  – Rohzählung, Grundlage der Zuordnung
         data/mastr_netzbetreiber.csv (mastr_nr;name;ort) – Namen aller vorkommenden Netzbetreiber
         data/mastr_stand.json   – Exportdatei, Größe, SHA-256, Zählstatistik
Die Zuordnungsregel (wer gilt je Gemeinde als zuständig) steht in src/baue_karte.py.
"""
import collections
import csv
import hashlib
import json
import os
import re
import sys
import time
import zipfile

from lxml import etree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EBENE = {"348": "HöS", "349": "HöS/HS", "350": "HS", "351": "HS/MS", "352": "MS", "353": "MS/NS", "354": "NS"}
IN_BETRIEB = "35"

pfad = sys.argv[1]
z = zipfile.ZipFile(pfad)
t0 = time.time()


def elemente(name, tag):
    """Streamt die Datensätze einer XML-Datei aus der ZIP, ohne sie zu entpacken."""
    with z.open(name) as f:
        for _, el in etree.iterparse(f, tag=tag, huge_tree=True):
            yield el
            el.clear()
            while el.getprevious() is not None:
                del el.getparent()[0]


def text(el, tag):
    x = el.find(tag)
    return x.text if x is not None else None


def dateien(prefix):
    return sorted((n for n in z.namelist() if re.fullmatch(prefix + r"(_\d+)?\.xml", n)),
                  key=lambda n: int(re.search(r"_(\d+)\.xml$", n).group(1)) if "_" in n[len(prefix):] else 0)


# 1) Netzanschlusspunkte: Lokation -> Liste (Netzbetreiber, Ebene)
nap = collections.defaultdict(list)
n_nap = 0
for name in dateien("Netzanschlusspunkte"):
    for el in elemente(name, "Netzanschlusspunkt"):
        lok, nb, eb = text(el, "LokationMaStRNummer"), text(el, "NetzbetreiberMaStRNummer"), text(el, "Spannungsebene")
        if lok and nb and eb in EBENE:
            nap[lok].append((nb, EBENE[eb]))
            n_nap += 1
    print(f"{name}: {n_nap} NAP, {time.time() - t0:.0f} s", flush=True)

# 2) Einheiten aller Sparten (Strom): Gemeinde und Lokation, nur in Betrieb
einheit_dateien = [n for n in z.namelist() if re.fullmatch(r"Einheiten(Solar|Wind|Biomasse|Wasser|Verbrennung|Kernkraft|"
                                                             r"GeothermieGrubengasDruckentspannung|StromSpeicher|StromVerbraucher)(_\d+)?\.xml", n)]
zaehl = collections.Counter()
stat = collections.Counter()
for name in sorted(einheit_dateien):
    root_tag = None
    with z.open(name) as f:  # Tag der Datensätze lesen (z. B. EinheitSolar)
        kopf = f.read(4000).decode("utf-16", errors="ignore")
        root_tag = re.search(r"<(Einheit\w+?)>", kopf.split(">", 2)[2]).group(1)
    for el in elemente(name, root_tag):
        stat["einheiten"] += 1
        if text(el, "EinheitBetriebsstatus") != IN_BETRIEB:
            continue
        ags, lok = text(el, "Gemeindeschluessel"), text(el, "LokationMaStRNummer")
        if not ags or not lok:
            stat["ohne_ags_oder_lokation"] += 1
            continue
        punkte = nap.get(lok)
        if not punkte:
            stat["ohne_nap"] += 1
            continue
        stat["gezaehlt"] += 1
        for nb, eb in set(punkte):
            zaehl[(ags, eb, nb)] += 1
    print(f"{name}: {stat['gezaehlt']} gezählt, {time.time() - t0:.0f} s", flush=True)

# 3) Namen der Netzbetreiber
nbs = {k[2] for k in zaehl}
namen = {}
for name in dateien("Marktakteure"):
    for el in elemente(name, "Marktakteur"):
        nr = text(el, "MastrNummer")
        if nr in nbs:
            namen[nr] = (text(el, "Firmenname") or "", text(el, "Ort") or "")

os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
with open(os.path.join(ROOT, "data", "mastr_zaehlung.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["ags", "ebene", "mastr_nr", "anzahl"])
    for (ags, eb, nb), n in sorted(zaehl.items()):
        w.writerow([ags, eb, nb, n])
with open(os.path.join(ROOT, "data", "mastr_netzbetreiber.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["mastr_nr", "name", "ort"])
    for nr in sorted(nbs):
        w.writerow([nr, *namen.get(nr, ("", ""))])

h = hashlib.sha256()
with open(pfad, "rb") as f:
    for b in iter(lambda: f.read(1 << 20), b""):
        h.update(b)
json.dump({"datei": os.path.basename(pfad), "bytes": os.path.getsize(pfad), "sha256": h.hexdigest(),
           "netzanschlusspunkte": n_nap, **stat, "laufzeit_s": round(time.time() - t0)},
          open(os.path.join(ROOT, "data", "mastr_stand.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("fertig", dict(stat), f"{time.time() - t0:.0f} s")
