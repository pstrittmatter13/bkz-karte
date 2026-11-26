"""Kartendaten aus dem BKZ-Datensatz und der MaStR-Zählung erzeugen.

Aufruf:  python src/baue_karte.py <Ordner der Veröffentlichungsfassung des Datensatzes>
         (oder Umgebungsvariable BKZ_DATENSATZ)
Eingaben: <Datensatz>/bkz_werte_lang.csv, bkz_quellen.csv, grundgesamtheit_mastr.csv, download_log.csv, README.md
          data/mastr_zaehlung.csv, data/mastr_netzbetreiber.csv, data/mastr_stand.json (aus netzbetreiber_gemeinde.py)
          zuordnung_hand.csv (Ausnahmen beim Abgleich Datensatz -> MaStR-Nummer, mit Begründung)
Ausgabe:  data/karte.json (alles, was die Seite braucht), datensatz/ (Kopie der Datensatzdateien für das Paket)

Zuordnungsregel Gemeinde -> zuständiger Netzbetreiber (Festlegung dieses Pakets, Näherung):
  MS-Netz (Ebenen MS und MS/NS): Netzbetreiber mit den meisten Einheiten in Betrieb, deren Netzanschlusspunkt
      in der Gemeinde auf MS oder MS/NS liegt. Ohne solchen Anschluss: dieselbe Regel mit NS-Anschlüssen
      (der NS-Betreiber betreibt in aller Regel auch das MS-Netz vor Ort; als „abgeleitet aus NS“ gekennzeichnet).
  HS-Netz (Ebenen HS, HS/MS, HöS/HS): Mehrheit der Anschlüsse auf HS oder HS/MS in der Gemeinde;
      ohne solchen Anschluss Mehrheit im Kreis, aber nur bei mindestens KREIS_MIN_N Anschlüssen und
      mindestens KREIS_MIN_ANTEIL für einen Netzbetreiber; sonst keine Zuordnung („nicht eindeutig“).
  Gemeindeschlüssel im MaStR mit 5 Stellen (kreisfreie Städte) werden um „000“ ergänzt.
  Gleichstand: kleinere MaStR-Nummer (nur damit das Ergebnis reproduzierbar ist; Anteil wird angezeigt).
"""
import collections
import csv
import json
import os
import shutil
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DS = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("BKZ_DATENSATZ")
if not DS or not os.path.isfile(os.path.join(DS, "bkz_werte_lang.csv")):
    sys.exit("Ordner der Veröffentlichungsfassung angeben (enthält bkz_werte_lang.csv), siehe WARTUNG.md.")
KREIS_MIN_N, KREIS_MIN_ANTEIL = 10, 0.6
EBENEN = ["HöS/HS", "HS", "HS/MS", "MS", "MS/NS", "NS"]
GRUPPE = {"HöS/HS": "hs", "HS": "hs", "HS/MS": "hs", "MS": "ms", "MS/NS": "ms", "NS": "ms"}
# datensatz/ = vollständige Veröffentlichungsfassung: alle Dateien aus SHA256SUMS.txt plus diese selbst,
# damit die Prüfsummen im Repo aufgehen (Zeilenenden schützt .gitattributes: datensatz/** -text)
KOPIE = [z.split(maxsplit=1)[1].strip() for z in open(os.path.join(DS, "SHA256SUMS.txt"), encoding="utf-8") if z.strip()]     + ["SHA256SUMS.txt"]


def lies(pfad):
    with open(pfad, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f, delimiter=";"))


def zahl(x):
    try:
        return float(str(x).replace(",", "."))
    except (TypeError, ValueError):
        return None


# ---------- Datensatz ----------
werte = lies(os.path.join(DS, "bkz_werte_lang.csv"))
quellen = lies(os.path.join(DS, "bkz_quellen.csv"))
gg = lies(os.path.join(DS, "grundgesamtheit_mastr.csv"))
sha = {r["id"]: r["sha256"] for r in lies(os.path.join(DS, "download_log.csv"))}
hand = {r["id"]: r for r in lies(os.path.join(ROOT, "zuordnung_hand.csv"))}
name2nr = {}
for r in gg:
    name2nr.setdefault(r["netzbetreiber"], r["mastr_nr"])

ohne_nr = []
dok = {}       # id -> Dokument
for q in quellen:
    nr = hand[q["id"]]["mastr_nr"] if q["id"] in hand else name2nr.get(q.get("mastr_name") or "")
    dok[q["id"]] = {
        "id": q["id"], "nr": nr, "vnb": q["netzbetreiber"], "jahr": q.get("bezugsjahr") or q.get("jahr"), "typ": q["typ"], "region": q["region"],
        "land": q["bundesland"], "titel": q["dokument"], "url": q["doc_url"], "pdf": q["pdf_datei"],
        "sha256": sha.get(q["id"], ""), "gueltig_ab": q["gueltig_ab"], "gueltig_bis": q["gueltig_bis"],
        "stand": q["stand"], "einheit": q["einheit"], "kategorie": q["veroeffentlichung"],
        "gilt_stichtag": q["gilt_stichtag"], "methode": q["methode_kat"], "methode_beleg": q["methode_beleg"],
        "faktor": zahl(q["faktor_num"]), "speicher": q["speicher_sonderregel"], "speicher_faktor": zahl(q["speicher_faktor"]),
        "fundort": q["fundort"], "suche": q["suche_2_beleg"], "werte": []}
for w in werte:
    d = dok.get(w["id"])
    if d is None:
        continue
    d["werte"].append({"ebene": w["netzebene"], "orig": w["netzebene_original"], "netto": zahl(w["bkz_netto"]),
                       "einheit": w["einheit"], "eur_kw": zahl(w["wert_eur_kw"]), "umrechnung": w["umrechnung_kva_kw"],
                       "aus": w["in_auswertung"] == "ja", "grund": w["ausschlussgrund"], "gilt_stichtag": w["gilt_stichtag"]})

vnb = collections.defaultdict(lambda: {"docs": []})
for d in dok.values():
    if d["nr"]:
        vnb[d["nr"]]["docs"].append(d)
    elif d["werte"] and any(x["aus"] for x in d["werte"]):
        ohne_nr.append(d["id"])
# Kennwert je VNB und Ebene: Wert in der Auswertung (am Stichtag gültig, Regeln des Datensatzes)
for nr, v in vnb.items():
    k = {}
    for d in v["docs"]:
        for x in d["werte"]:
            if x["aus"] and x["eur_kw"] is not None:
                k.setdefault(x["ebene"], (x["eur_kw"], d["id"]))
    v["kenn"] = {e: {"w": w_, "id": i} for e, (w_, i) in k.items()}
    v["status"] = ("Wert" if k else
                   next((d["kategorie"] for d in v["docs"] if d["kategorie"]), "keine Angabe"))

# ---------- MaStR ----------
zaehl = collections.defaultdict(collections.Counter)   # (ags, gruppe-ebene) -> Counter(nr)
_ags_vg = None  # wird nach dem Laden der Gemeinden gesetzt
_roh = lies(os.path.join(ROOT, "data", "mastr_zaehlung.csv"))
mnamen = {r["mastr_nr"]: {"name": r["name"], "ort": r["ort"]} for r in lies(os.path.join(ROOT, "data", "mastr_netzbetreiber.csv"))}
mstand = json.load(open(os.path.join(ROOT, "data", "mastr_stand.json"), encoding="utf-8"))
gemeinden = json.load(open(os.path.join(ROOT, "data", "gemeinden.geojson"), encoding="utf-8"))
ags_liste = [f["properties"]["ags"] for f in gemeinden["features"]]
_ags_vg = set(ags_liste)
for r in _roh:
    a = r["ags"]
    if len(a) == 5 and a + "000" in _ags_vg:
        a += "000"
    zaehl[(a, r["ebene"])][r["mastr_nr"]] += int(r["anzahl"])




def sieger(c):
    if not c:
        return None
    n = sum(c.values())
    nr, k = sorted(c.items(), key=lambda t: (-t[1], t[0]))[0]
    return nr, round(k / n, 3), n, [[a, b] for a, b in sorted(c.items(), key=lambda t: (-t[1], t[0]))[:4]]


# Vorab je Gemeinde zählen (Präfixsummen für Kreis/Land nur bei Bedarf)
per_ags = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
for (a, e), cc in zaehl.items():
    per_ags[a][e].update(cc)
kreis = collections.defaultdict(collections.Counter)
for a, d in per_ags.items():
    for e in ("HS", "HS/MS"):
        kreis[a[:5]].update(d[e])

# Zweite Quelle für die HS-Lücke: zuordnung_vnbdigital.csv (Abfrage je Gemeinde auf vnbdigital.de, Filter Hochspannung)
vnbd = {}
_vp = os.path.join(ROOT, "zuordnung_vnbdigital.csv")
if os.path.isfile(_vp):
    for r in lies(_vp):
        nrs = [x for x in r["mastr_nr"].split("|") if x]
        vnbd[r["ags"]] = {"nr": nrs, "namen": [x for x in r["hs_betreiber"].split("|") if x],
                          "abruf": r["abruf"], "url": r["vnbdigital_url"]}

gem = {}
stat = collections.Counter()
for a in ags_liste:
    d = per_ags.get(a, {})
    ms = sieger(d.get("MS", collections.Counter()) + d.get("MS/NS", collections.Counter()))
    ms_basis = "MS"
    if ms is None:
        ms, ms_basis = sieger(d.get("NS", collections.Counter())), "NS"
    hs = sieger(d.get("HS", collections.Counter()) + d.get("HS/MS", collections.Counter()))
    hs_basis = "Gemeinde"
    if hs is None:
        k = sieger(kreis.get(a[:5], collections.Counter()))
        if k and k[2] >= KREIS_MIN_N and k[1] >= KREIS_MIN_ANTEIL:
            hs, hs_basis = k, "Kreis"
        elif k:
            stat["hs_kreis_zu_unsicher"] += 1
    if hs is None and a in vnbd and len(vnbd[a]["nr"]) == 1:
        # Lücke im MaStR: HS-Betreiber laut VNBdigital (einziger Netzbetreiber mit Hochspannung in der Gemeinde)
        nr_ = vnbd[a]["nr"][0]
        hs, hs_basis = (nr_, 1.0, 0, [[nr_, 0]]), "VNBdigital"
    e = {}
    if ms:
        e["ms"] = [ms[0], ms[1], ms[2], ms_basis, ms[3]]
        stat["ms_" + ms_basis] += 1
    else:
        stat["ms_keiner"] += 1
    if hs:
        e["hs"] = [hs[0], hs[1], hs[2], hs_basis, hs[3]]
        stat["hs_" + hs_basis] += 1
    else:
        stat["hs_keiner"] += 1
    gem[a] = e


# Nur Netzbetreiber, die in der Karte oder im Datensatz vorkommen
genutzt = {x for e in gem.values() for k in ("ms", "hs") if k in e for x in [e[k][0]] + [y[0] for y in e[k][4]]}
genutzt |= set(vnb)
# Größe je Netzbetreiber: Erlösobergrenze 2026 (BNetzA) über eog_zuordnung.csv, für die Sortierung der Tabelle
eog_u = {r["Unternehmen"]: zahl(r["eog_2026_eur"]) for r in lies(os.path.join(DS, "groesse_eog_2026.csv"))}
eog_id = {r["id"]: eog_u.get(r["eog_unternehmen"]) for r in lies(os.path.join(DS, "eog_zuordnung.csv"))}


def norm(s):   # Namensabgleich für VNB ohne Wert (nicht in eog_zuordnung.csv): Klammern, Rechtsform, Satzzeichen weg
    import re
    s = re.sub(r"\(.*?\)", " ", (s or "").lower().replace("＆", "&"))
    s = re.sub(r"\b(gmbh|mbh|ag|kg|co|eg|se|& co\.? kg)\b", " ", s)
    return re.sub(r"[^a-zäöüß0-9]+", "", s)


eog_norm = {norm(u): w for u, w in eog_u.items()}
aus_vnb = {}
for nr in sorted(genutzt):
    v = vnb.get(nr)
    eog = max((eog_id.get(d["id"]) or eog_norm.get(norm(d["vnb"])) or 0 for d in v["docs"]), default=0) if v else 0
    eog = eog or eog_norm.get(norm(mnamen.get(nr, {}).get("name", "")), 0)
    aus_vnb[nr] = {"name": mnamen.get(nr, {}).get("name") or (v["docs"][0]["vnb"] if v else nr),
                   "ort": mnamen.get(nr, {}).get("ort", ""),
                   "status": v["status"] if v else "nicht im Datensatz",
                   "kenn": v["kenn"] if v else {},
                   "docs": [x["id"] for x in v["docs"]] if v else []}
    if eog:
        aus_vnb[nr]["eog_mio"] = round(eog / 1e6, 1)

# Abdeckung: Erlösobergrenzen (aus dem Datensatz) und je Ebene Gemeinden/Einwohner mit Wert
eog_zeilen = lies(os.path.join(DS, "groesse_eog_2026.csv"))
eog = {r["Unternehmen"]: float(r["eog_anteil_%"]) for r in eog_zeilen}
eog_zu = lies(os.path.join(DS, "eog_zuordnung.csv"))
eog_anteil = round(sum(eog.get(r["eog_unternehmen"], 0) for r in eog_zu), 1)
ew = {f["properties"]["ags"]: f["properties"]["ew"] for f in gemeinden["features"]}
ew_ges = sum(ew.values())
abdeckung = {}
for e in ["HS", "HS/MS", "MS", "MS/NS"]:
    g = GRUPPE[e]
    mit = [a for a, z in gem.items() if g in z and z[g][0] in vnb and e in vnb[z[g][0]]["kenn"]]
    zug = [a for a, z in gem.items() if g in z]
    abdeckung[e] = {"gem_mit_wert": len(mit), "gem_zugeordnet": len(zug), "gem_gesamt": len(gem),
                    "ew_mit_wert_anteil": round(sum(ew[a] for a in mit) / ew_ges, 3),
                    "vnb_mit_wert": sum(1 for v in vnb.values() if e in v["kenn"])}

out = {
    "erzeugt": date.today().isoformat(),
    "datensatz": {"ordner": os.path.basename(DS.rstrip("/\\")), "stichtag": "2026-11-24",
                  "werte_in_auswertung": sum(1 for w in werte if w["in_auswertung"] == "ja"),
                  "vnb_mit_wert": sum(1 for v in vnb.values() if v["kenn"]),
                  "eog_anteil_prozent": eog_anteil, "vnb_gesamt_eog_liste": len(eog_zeilen)},
    "abdeckung": abdeckung,
    "mastr": mstand,
    "regel_stat": stat,
    "ebenen": EBENEN, "gruppe": GRUPPE,
    "vnb": aus_vnb,
    "docs": {i: d for i, d in dok.items() if d["nr"] or d["werte"]},
    "gem": gem,
    "vnbdigital": {a: {"namen": v["namen"], "abruf": v["abruf"], "url": v["url"]} for a, v in vnbd.items()},
}
with open(os.path.join(ROOT, "data", "karte.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

os.makedirs(os.path.join(ROOT, "datensatz"), exist_ok=True)
for n in KOPIE:
    shutil.copy2(os.path.join(DS, n), os.path.join(ROOT, "datensatz", n))

print("Gemeinden:", len(gem), dict(stat))
print("VNB im Datensatz mit MaStR-Nr.:", len(vnb), "· mit Wert:", sum(1 for v in vnb.values() if v["kenn"]))
if ohne_nr:
    print("WARNUNG – Dokumente mit Wert, aber ohne MaStR-Nr. (in zuordnung_hand.csv eintragen):", ohne_nr)
print("karte.json", f"{os.path.getsize(os.path.join(ROOT, 'data', 'karte.json')) / 1e6:.1f} MB")
