"""HS-Betreiber je Gemeinde aus VNBdigital-Abrufen in zuordnung_vnbdigital.csv übernehmen.

Aufruf:  python src/vnbdigital_csv.py <abrufe.json>
Eingabe: abrufe.json – je Gemeinde ein Abruf von vnbdigital.de (Ort/Gemeinde gesucht, Filter Spannungsbereich
         „Hochspannung“): {ags, name, kreis, abruf (ISO-Zeit), gewaehlt (Suchtreffer mit Kreis), community, text}.
         Abgefragt wurden nur Gemeinden ohne HS-Zuordnung aus dem Marktstammdatenregister.
Ausgabe: zuordnung_vnbdigital.csv (wird ergänzt, vorhandene Gemeinden werden überschrieben):
         ags; gemeinde; kreis; hs_betreiber (Namen laut VNBdigital, „|“-getrennt); mastr_nr (zugeordnete
         MaStR-Nummern, gleiche Reihenfolge); abruf (Datum); vnbdigital_url (Seite mit Filter Hochspannung).
Namen -> MaStR-Nummer über exakten Namensabgleich mit data/mastr_netzbetreiber.csv; fehlt ein Treffer,
bleibt mastr_nr leer und die Gemeinde wird nicht eingefärbt (Meldung am Ende).
"""
import csv
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(ROOT, "zuordnung_vnbdigital.csv")
FILTER = "eyJvbmx5TmFwIjpmYWxzZSwidm9sdGFnZVR5cGVzIjpbIkhvY2hzcGFubnVuZyJdLCJ3aXRoUmVnaW9ucyI6ZmFsc2V9"  # {"voltageTypes":["Hochspannung"],…}
SPALTEN = ["ags", "gemeinde", "kreis", "hs_betreiber", "mastr_nr", "abruf", "vnbdigital_url"]


def norm(s):
    return re.sub(r"\s+", " ", s.replace("＆", "&")).strip().lower()


def betreiber(text):
    """Netzbetreiber mit Hochspannung aus dem Seitentext: '<Name> Verteilnetzbetreiber Niederspannung … Hochspannung …'."""
    namen = []
    for m in re.finditer(r"(?:^|Regionalszenario |Netzanschluss |Netzausbauplan )?([^|]+?) (?:Verteilnetzbetreiber|Übertragungsnetzbetreiber)((?: (?:Niederspannung|Mittelspannung|Hochspannung|Höchstspannung))+)", text):
        name = re.sub(r"^(?:(?:Netzanschluss|Netzausbauplan|Regionalszenario|Netzdienliche Steuerung) )+", "", m.group(1).strip())
        if "Hochspannung" in m.group(2):
            namen.append(name)
    return namen


def main():
    abrufe = json.load(open(sys.argv[1], encoding="utf-8"))
    mastr = {}
    with open(os.path.join(ROOT, "data", "mastr_netzbetreiber.csv"), encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            mastr.setdefault(norm(r["name"]), r["mastr_nr"])
    alt = {}
    if os.path.isfile(ZIEL):
        with open(ZIEL, encoding="utf-8-sig", newline="") as f:
            alt = {r["ags"]: r for r in csv.DictReader(f, delimiter=";")}
    ohne_nr, ohne_treffer = set(), []
    for a in abrufe:
        if not a.get("community"):
            ohne_treffer.append(a.get("name"))
            continue
        namen = betreiber(a["text"])
        nrs = [mastr.get(norm(n), "") for n in namen]
        ohne_nr |= {n for n, x in zip(namen, nrs) if not x}
        alt[a["ags"]] = {"ags": a["ags"], "gemeinde": a["name"], "kreis": a.get("kreis", ""),
                         "hs_betreiber": "|".join(namen), "mastr_nr": "|".join(nrs), "abruf": a["abruf"][:10],
                         "vnbdigital_url": f"https://www.vnbdigital.de/overview?filter={FILTER}&communityId={a['community']}"}
    with open(ZIEL, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, SPALTEN, delimiter=";")
        w.writeheader()
        for k in sorted(alt):
            w.writerow({s: alt[k].get(s, "") for s in SPALTEN})
    rows = list(alt.values())
    print(f"{len(rows)} Gemeinden in {os.path.basename(ZIEL)}: "
          f"{sum(1 for r in rows if r['hs_betreiber'] and '|' not in r['hs_betreiber'])} mit einem HS-Betreiber, "
          f"{sum(1 for r in rows if '|' in r['hs_betreiber'])} mit mehreren, {sum(1 for r in rows if not r['hs_betreiber'])} ohne")
    if ohne_treffer:
        print("Kein Suchtreffer (von Hand nachsehen):", ", ".join(ohne_treffer))
    if ohne_nr:
        print("Ohne MaStR-Nummer (Name nicht gefunden):", ", ".join(sorted(ohne_nr)))


if __name__ == "__main__":
    main()
