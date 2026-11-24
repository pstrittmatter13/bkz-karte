# BKZ-Karte – Baukostenzuschüsse oberhalb der Niederspannung in Deutschland

**Karte öffnen: https://pstrittmatter13.github.io/bkz-karte/**

Datensatz und interaktive Karte der Baukostenzuschüsse (BKZ), die Stromverteilnetzbetreiber (VNB) für Netzanschlüsse auf Hochspannung (HS), Umspannung HS/MS, Mittelspannung (MS) und Umspannung MS/NS erheben. Stichtag **24.11.2026**.

- **329 Werte von 124 VNB**, die zusammen für 75,8 % der Erlösobergrenzen 2026 aller 808 VNB stehen. Jeder Wert stammt aus dem veröffentlichten Preisblatt des VNB; URL, Fundstelle und SHA-256-Prüfsumme des gesicherten Originals sind angegeben. Berechnungsmethode, Abschläge und Speicherregeln sind kodiert.
- **Zuständiger Netzbetreiber je Gemeinde** und Spannungsebene, abgeleitet aus dem Marktstammdatenregister (MaStR) der Bundesnetzagentur. Netzgebietsgrenzen werden in Deutschland nicht amtlich veröffentlicht; die Ableitung ist eine offengelegte Näherung ([METHODIK.md](METHODIK.md)).
- **Keine Schätzwerte:** Wo kein BKZ veröffentlicht ist oder der Netzbetreiber nicht eindeutig ist, bleibt die Gemeinde grau.

Hauptergebnis (Median über die VNB, €/kW netto): HS 110,0 · HS/MS 113,0 · MS 125,5 · MS/NS 122,0. Regeln, Prüfung und Grenzen: [datensatz/README.md](datensatz/README.md).

## Was die Seite zeigt

| Element | Inhalt |
|---|---|
| Karte | Gemeinden, eingefärbt nach dem BKZ des zuständigen VNB auf der gewählten Ebene (feste Klassen in €/kW) |
| Klick auf eine Gemeinde | zuständiger VNB für MS- und HS-Netz mit Anteil der Anschlüsse, alle BKZ-Werte, Methode, Gültigkeit, Link zum Preisblatt, Archivdatei mit SHA-256 |
| Median je Region | über die VNB mit Wert (Nord, Ost, West, Süd) |
| Tabelle | alle VNB mit Wert, filter- und sortierbar; Download der Werte als CSV |

## Inhalt des Repositoriums

| Pfad | Inhalt |
|---|---|
| `index.html`, `assets/` | Seite (statisches HTML/JavaScript, GitHub Pages) |
| `datensatz/` | BKZ-Datensatz, Veröffentlichungsfassung mit eigenem README (Codebuch, Regeln, Prüfung) |
| `data/karte.json` | alle Angaben, die die Seite anzeigt (erzeugt von `src/baue_karte.py`) |
| `data/mastr_zaehlung.csv` | Anlagen in Betrieb je Gemeinde, Spannungsebene und Netzbetreiber aus dem MaStR |
| `data/mastr_netzbetreiber.csv`, `data/mastr_stand.json` | Namen der Netzbetreiber; verwendete Exportdatei mit Größe und SHA-256 |
| `data/gemeinden.geojson`, `data/laender.geojson` | Gemeinde- und Ländergrenzen (BKG), vereinfacht, UTM32 in km |
| `zuordnung_hand.csv` | Ausnahmen beim Abgleich Datensatz ↔ MaStR, mit Begründung |
| `src/` | Skripte, die alle Dateien in `data/` erzeugen |
| `CITATION.cff`, `LICENSE` | Zitierangaben, Lizenzen |

## Zitieren

> Schneider-Strittmatter, P. (2026): *BKZ-Karte: Baukostenzuschüsse der Stromverteilnetzbetreiber oberhalb der Niederspannung in Deutschland, Stichtag 24.11.2026* (Version 1.0.0) [Datensatz und Karte]. https://github.com/pstrittmatter13/bkz-karte

```bibtex
@misc{schneiderstrittmatter2026bkzkarte,
  author       = {Schneider-Strittmatter, Paul},
  title        = {{BKZ-Karte}: Baukostenzuschüsse der Stromverteilnetzbetreiber oberhalb der Niederspannung in Deutschland, Stichtag 24.11.2026},
  year         = {2026},
  version      = {1.0.0},
  howpublished = {Datensatz und interaktive Karte},
  url          = {https://github.com/pstrittmatter13/bkz-karte},
  note         = {Karte: https://pstrittmatter13.github.io/bkz-karte/}
}
```
Eine DOI (Zenodo) folgt; dann bitte mit DOI zitieren. GitHub zeigt die Angaben aus `CITATION.cff` unter „Cite this repository“.

## Lizenzen und Quellenvermerke

- **Daten, Karte, Texte:** CC BY 4.0 · **Code:** MIT · Einzelheiten: [LICENSE](LICENSE)
- **Netzbetreiber-Zuordnung:** Bundesnetzagentur, Marktstammdatenregister, Gesamtdatenexport vom 24.11.2026 ([Datendownload](https://www.marktstammdatenregister.de/MaStR/Datendownload)), [Datenlizenz Deutschland – Namensnennung – Version 2.0](https://www.govdata.de/dl-de/by-2-0). Daten verändert: Anlagen je Gemeinde gezählt, zuständiger Netzbetreiber abgeleitet.
- **Gemeinde- und Ländergrenzen:** © [BKG](https://www.bkg.bund.de) (2026) [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), Datenquellen: https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf · VG250-EW, Gebietsstand 31.12.2025. Daten verändert: vereinfacht, gerundet, nur Landflächen.
- **BKZ-Werte:** Preisblätter der Netzbetreiber, je Wert verlinkt. Die Originaldokumente sind nicht enthalten (Rechte der Netzbetreiber); nachprüfbar über URL und SHA-256 in `datensatz/download_log.csv`. Maßgeblich sind die Preisblätter der Netzbetreiber; keine Gewähr für Vollständigkeit.
- **d3.js** 7.8.5 (ISC), zur Laufzeit von cdnjs geladen.

## Entstehung

Erhebung, Kodierung, Skripte und Texte entstanden mit Unterstützung des KI-Assistenten Claude (Anthropic) unter Anleitung und Verantwortung des Autors; Claude ist kein Autor. Festlegungen (Geltungsbereich, Stichtagsregel, Zuordnungsregel, Ausschlüsse) traf der Autor. Jeder Wert ist am Original geprüft; Prüfungen und ihre Ergebnisse: `datensatz/README.md`, Abschnitt 3.5. Entstanden im Rahmen einer Bachelorarbeit an der HTWG Konstanz.

## Aktualisieren

Nichts in `data/` oder `datensatz/` wird von Hand geändert. Die einzige Stelle für BKZ-Werte ist der Arbeitsstand des Datensatzes (`_intern/records.jsonl`, nicht in diesem Repositorium); daraus entsteht die Veröffentlichungsfassung.

```
# 1. Datensatz neu bauen (im Arbeitsordner des Datensatzes)
python _intern/build.py
python _intern/eog_abdeckung_2026-11-24.py
python _intern/paket_veroeffentlichung.py
# 2. Karte neu bauen (hier); Argument = Ordner der Veröffentlichungsfassung
python src/baue_karte.py "<Pfad>/BKZ/Veroeffentlichung"
```
Meldet `baue_karte.py` einen Wert ohne MaStR-Nummer, die Zeile in `zuordnung_hand.csv` ergänzen.

**Neuer MaStR-Stand** (z. B. jährlich): Gesamtdatenexport laden, dann `python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip` (ca. 6 min) und `baue_karte.py`. **Neue Gemeindegrenzen (BKG, jährlich):** `python src/gemeinden.py <DE_VG250.gpkg>`, danach `baue_karte.py`. Bei jeder neuen Fassung Version und Datum in `CITATION.cff` anheben.

Voraussetzung: Python 3.11+ mit `lxml` und `shapely`. `rohdaten/` (MaStR-Export, BKG-Download) ist nicht im Repositorium.

Lokal ansehen: `python -m http.server 8000`, dann http://localhost:8000.

Fragen und Hinweise auf Fehler: über GitHub-Issues in diesem Repositorium.
