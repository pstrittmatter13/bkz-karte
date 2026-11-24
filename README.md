# BKZ-Karte – Baukostenzuschüsse oberhalb der Niederspannung in Deutschland

Interaktive Karte und Datensatz der Baukostenzuschüsse (BKZ), die Stromverteilnetzbetreiber für Anschlüsse auf HS, HS/MS, MS und MS/NS erheben. Jeder Wert stammt aus dem veröffentlichten Preisblatt des Netzbetreibers und ist mit Fundstelle, Archivdatei und SHA-256-Prüfsumme belegt. Welcher Netzbetreiber in einer Gemeinde zuständig ist, wird aus dem Marktstammdatenregister der Bundesnetzagentur abgeleitet ([METHODIK.md](METHODIK.md)).

**Seite:** `index.html` (GitHub Pages) · **Stichtag:** 24.11.2026

## Inhalt

| Pfad | Inhalt |
|---|---|
| `index.html`, `assets/` | Seite: Karte nach Ebene, Klick auf Gemeinde → Netzbetreiber, Werte, Methode, Beleg; Tabelle aller Netzbetreiber |
| `datensatz/` | BKZ-Datensatz (Kopie der Veröffentlichungsfassung, eigenes `README.md` mit Regeln und Prüfung) |
| `data/karte.json` | alles, was die Seite anzeigt (aus `src/baue_karte.py`) |
| `data/mastr_zaehlung.csv` | Anschlüsse je Gemeinde, Spannungsebene und Netzbetreiber aus dem MaStR |
| `data/mastr_netzbetreiber.csv`, `data/mastr_stand.json` | Namen der Netzbetreiber; Exportdatei mit Prüfsumme |
| `data/gemeinden.geojson`, `data/laender.geojson` | Gemeinde- und Ländergrenzen (BKG), vereinfacht, UTM32 in km |
| `zuordnung_hand.csv` | Ausnahmen beim Abgleich Datensatz ↔ MaStR, mit Begründung |
| `src/` | Skripte, die alles erzeugen |

## Aktualisieren

Nichts wird von Hand in `data/` oder `datensatz/` geändert. Die einzige Stelle für BKZ-Werte ist der Datensatz (`_intern/records.jsonl` im BKZ-Ordner).

**Neuer oder geänderter Netzbetreiber im Datensatz:**
```
# im BKZ-Ordner: Datensatz neu bauen und Veröffentlichungsfassung erzeugen
python _intern/build.py
python _intern/eog_abdeckung_2026-11-24.py
python _intern/paket_veroeffentlichung.py
# hier:
python src/baue_karte.py            # liest den Datensatz, schreibt data/karte.json und datensatz/
```
Meldet `baue_karte.py` einen Wert ohne MaStR-Nummer, die Zeile in `zuordnung_hand.csv` ergänzen.

**Neuer MaStR-Stand** (z. B. jährlich mit dem Datensatz):
```
python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip   # ca. 30–60 min
python src/baue_karte.py
```
**Neue Gemeindegrenzen (BKG, jährlich):** `python src/gemeinden.py rohdaten/vg250/.../DE_VG250.gpkg`, danach `baue_karte.py`.

Voraussetzung: Python 3.11+ mit `lxml` und `shapely`. `rohdaten/` (MaStR-Export, BKG-Download) ist nicht im Repo.

Lokal ansehen: `python -m http.server 8000`, dann http://localhost:8000.

## Quellen und Lizenzen

- BKZ-Werte: Preisblätter der Netzbetreiber, je Wert verlinkt; Datensatz und Karte: CC BY 4.0
- Netzbetreiber-Zuordnung: Bundesnetzagentur, Marktstammdatenregister, Gesamtdatenexport, Datenlizenz Deutschland – Namensnennung – 2.0 (dl-de/by-2-0)
- Gemeinde- und Ländergrenzen: © GeoBasis-DE / BKG (2025), VG250-EW, dl-de/by-2-0
- d3.js 7.8.5 (ISC), geladen von cdnjs

Maßgeblich sind die Preisblätter der Netzbetreiber; keine Gewähr für Vollständigkeit.

## Zitieren

Schneider-Strittmatter, P. (2026): BKZ-Karte – Baukostenzuschüsse oberhalb der Niederspannung in Deutschland, Stichtag 24.11.2026. Version 1. DOI folgt (Zenodo).
