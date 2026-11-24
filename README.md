# BKZ-Karte – Baukostenzuschüsse oberhalb der Niederspannung in Deutschland

**Karte öffnen: https://pstrittmatter13.github.io/bkz-karte/** · Stichtag **24.11.2026** · Version 1.0.0

Datensatz und interaktive Karte der Baukostenzuschüsse (BKZ), die Stromverteilnetzbetreiber (VNB) für Netzanschlüsse auf Hochspannung (HS), Umspannung HS/MS, Mittelspannung (MS) und Umspannung MS/NS erheben. Jeder Wert stammt aus dem veröffentlichten Preisblatt des VNB und ist bis zum Original nachverfolgbar. Welcher VNB in einer Gemeinde zuständig ist, wird aus dem Marktstammdatenregister (MaStR) der Bundesnetzagentur abgeleitet.

| Kennzahl | Wert |
|---|---|
| Werte in der Auswertung | 329 von 124 VNB |
| Anteil dieser VNB an den Erlösobergrenzen 2026 aller 808 VNB | 75,8 % |
| Einwohner in Gemeinden mit MS-Wert | 72 % (9.003 von 10.949 Gemeinden) |
| Median über die VNB, €/kW netto | HS 110,0 · HS/MS 113,0 · MS 125,5 · MS/NS 122,0 |
| MS nach Region (Median, Zahl der VNB) | Nord 117,1 (14) · Ost 108,0 (15) · West 129,5 (54) · Süd 126,9 (38) |

## Inhalt

1. [Was die Seite zeigt](#1-was-die-seite-zeigt)
2. [Abdeckung und Grenzen](#2-abdeckung-und-grenzen)
3. [Nachvollziehbarkeit: vom Wert zum Original](#3-nachvollziehbarkeit-vom-wert-zum-original)
4. [Dateien](#4-dateien)
5. [Zitieren](#5-zitieren)
6. [Lizenzen und Quellenvermerke](#6-lizenzen-und-quellenvermerke)
7. [Entstehung und Prüfung](#7-entstehung-und-prüfung)
8. [Aktualisieren](#8-aktualisieren)

## 1 Was die Seite zeigt

| Element | Inhalt |
|---|---|
| Karte | Gemeinden, eingefärbt nach dem BKZ des zuständigen VNB auf der gewählten Ebene; feste Klassen in €/kW, für alle Ebenen gleich |
| Klick auf eine Gemeinde | zuständiger VNB für MS- und HS-Netz mit Anteil der Anschlüsse; alle BKZ-Werte des VNB, Methode, Gültigkeit, Link zum Preisblatt, Archivdatei mit SHA-256 |
| Kennzahlen, Median je Region | Abdeckung der gewählten Ebene; Median über die VNB mit Wert |
| Tabelle | alle VNB mit Wert, filter- und sortierbar; Werte als CSV |
| Grau | dunkel: gesucht, kein Wert veröffentlicht · hell: noch nicht erhoben oder Netzbetreiber nicht eindeutig |

Keine Schätzwerte: Wo kein BKZ veröffentlicht ist oder der Netzbetreiber nicht eindeutig ist, bleibt die Gemeinde grau.

## 2 Abdeckung und Grenzen

**Wer erhoben ist.** Grundgesamtheit sind die 808 VNB der BNetzA-Liste der Erlösobergrenzen (EOG) 2026. Durchsucht wurden die VNB nach absteigender EOG bis 90 % der Summe (234 VNB), dazu bereits erfasste VNB; danach eine Nachsuche bei den größten VNB ohne Wert. Ergebnis: 124 VNB mit Wert = **75,8 % der EOG**. Die übrigen 24,2 % verteilen sich auf über 680 meist kleine VNB, die nach der Erfahrung der Suche selten einen Wert oberhalb NS veröffentlichen. Der Datensatz ist **keine Zufallsstichprobe**; Aussagen gelten für die erfassten VNB.

**Was die Grauflächen bedeuten.** „Gesucht, kein Wert veröffentlicht“ umfasst VNB, die nur eine Rechenregel nennen, „auf Anfrage“ kalkulieren oder nur einen NS-BKZ ausweisen – das ist selbst ein Befund zur Transparenz. „Nicht erhoben“ heißt nicht, dass kein BKZ erhoben wird.

**Netzgebiete sind eine Näherung.** Grenzen von Netzgebieten werden nicht amtlich veröffentlicht. Zuständig ist hier der VNB, an den die meisten Anlagen in Betrieb in der Gemeinde auf der Ebene angeschlossen sind ([METHODIK.md](METHODIK.md)). Gemeinden mit mehreren VNB erscheinen beim überwiegenden (Anteil im Panel). Beim HS-Netz wird nur bei klarer Mehrheit zugeordnet; in 3.150 Gemeinden ist der HS-Betreiber deshalb offen.

**Was die Werte sind – und was nicht.**
- netto, wie veröffentlicht, am Stichtag gültig; pauschale Abschläge des VNB sind enthalten, **Speicher- und Flexibilitätsrabatte nicht** (für Batteriespeicher kann der tatsächliche BKZ deutlich niedriger sein);
- €/kVA mit dem Faktor laut Preisblatt umgerechnet, ohne Angabe mit 1,0 (cos φ = 1; 30 Werte);
- ältere, weiter veröffentlichte Blätter ohne Nachfolger zählen; Blätter für 2027 noch nicht;
- jeder VNB zählt in Medianen einmal, unabhängig von Größe, Fläche oder Anschlusszahl.

Weitere Grenzen und eine Sensitivitätsrechnung (wie stark Regelentscheidungen die Mediane verschieben): [datensatz/README.md](datensatz/README.md), Abschnitte 1 und 5.

## 3 Nachvollziehbarkeit: vom Wert zum Original

| Schritt | wo |
|---|---|
| Wert, Ebene, Einheit, Methode | `datensatz/bkz_werte_lang.csv` (ID `BKZnnn`) |
| Dokument, URL, Fundort, Gültigkeit | `datensatz/bkz_quellen.csv` |
| gesichertes Original: Dateiname, Abrufweg, Größe, **SHA-256** | `datensatz/download_log.csv` – wer das Preisblatt erneut lädt, kann prüfen, ob es dasselbe Dokument ist |
| zuständiger VNB je Gemeinde | `data/mastr_zaehlung.csv` (Anlagen je Gemeinde, Ebene, VNB) aus dem MaStR-Export mit SHA-256 in `data/mastr_stand.json`; Regel in `src/baue_karte.py` |
| Verknüpfung Datensatz ↔ MaStR | Name laut MaStR je Dokument; Ausnahmen mit Begründung in `zuordnung_hand.csv` |

Alle Dateien in `data/` entstehen aus diesen Quellen über die Skripte in `src/`; nichts ist von Hand eingetragen.

## 4 Dateien

| Pfad | Inhalt |
|---|---|
| `index.html`, `assets/` | Seite (statisches HTML/JavaScript, GitHub Pages) |
| `datensatz/` | BKZ-Datensatz, Veröffentlichungsfassung mit eigenem README (Codebuch, Regeln, Prüfung, Grenzen) |
| `data/karte.json` | alle Angaben, die die Seite anzeigt |
| `data/mastr_zaehlung.csv`, `data/mastr_netzbetreiber.csv`, `data/mastr_stand.json` | MaStR-Auswertung, Namen der VNB, verwendete Exportdatei |
| `data/gemeinden.geojson`, `data/laender.geojson` | Gemeinde- und Ländergrenzen (BKG), vereinfacht, UTM32 in km |
| `zuordnung_hand.csv` | Ausnahmen beim Abgleich Datensatz ↔ MaStR |
| `src/` | Skripte: `netzbetreiber_gemeinde.py` (MaStR), `gemeinden.py` (Grenzen), `baue_karte.py` (Kartendaten) |
| `METHODIK.md` | Zuordnungsregel, Farbskala, Kennzahlen |
| `CITATION.cff`, `LICENSE` | Zitierangaben, Lizenzen |

## 5 Zitieren

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

## 6 Lizenzen und Quellenvermerke

- **Daten, Karte, Texte:** © 2026 Paul Schneider-Strittmatter, CC BY 4.0 · **Code:** MIT · Einzelheiten: [LICENSE](LICENSE)
- **BKZ-Werte:** Preisblätter der Netzbetreiber, je Wert verlinkt. Die Originaldokumente sind nicht enthalten (Rechte der Netzbetreiber); nachprüfbar über URL und SHA-256. Maßgeblich sind die Preisblätter der Netzbetreiber; keine Gewähr für Vollständigkeit.
- **Netzbetreiber-Zuordnung:** Bundesnetzagentur, Marktstammdatenregister, Gesamtdatenexport vom 24.11.2026 ([Datendownload](https://www.marktstammdatenregister.de/MaStR/Datendownload)), [Datenlizenz Deutschland – Namensnennung – Version 2.0](https://www.govdata.de/dl-de/by-2-0). Daten verändert: Anlagen je Gemeinde gezählt, zuständiger Netzbetreiber abgeleitet.
- **Gemeinde- und Ländergrenzen:** © [BKG](https://www.bkg.bund.de) (2026) [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), Datenquellen: https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf · VG250-EW, Gebietsstand 31.12.2025. Daten verändert: vereinfacht, gerundet, nur Landflächen.
- **Erlösobergrenzen 2026:** BNetzA-Veröffentlichung nach § 23b EnWG (`datensatz/groesse_eog_2026.csv`).
- **d3.js** 7.8.5 (ISC), zur Laufzeit von cdnjs geladen.

## 7 Entstehung und Prüfung

Erhebung, Kodierung, Skripte und Texte entstanden mit Unterstützung des KI-Assistenten Claude (Anthropic) unter Anleitung und Verantwortung des Autors; Claude ist kein Autor. Festlegungen (Geltungsbereich, Stichtagsregel, Zuordnungsregel, Ausschlüsse) traf der Autor. Entstanden im Rahmen einer Bachelorarbeit an der HTWG Konstanz.

Prüfung (Einzelheiten: `datensatz/README.md`, Abschnitt 3.5): jeder Wert am Original nachgelesen · Stichprobe des Autors (40 Werte, 0 Fehler) · zwei unabhängige Prüfungen durch KI-Modelle gegen die Originale (zusammen 60 Dokumente; 0 Fehler bei Wert, Einheit und Netzebene, Metadatenfehler, ein übersehener Wert und ein übersehenes Preisblatt wurden am Original nachgeprüft und korrigiert) · Regelprüfung per Skript (`pruefung.py`, 0 Befunde). Eine Prüfung durch eine weitere Person steht aus.

Fragen und Hinweise auf Fehler: über GitHub-Issues in diesem Repositorium.

## 8 Aktualisieren

Nichts in `data/` oder `datensatz/` wird von Hand geändert. Die einzige Stelle für BKZ-Werte ist der Arbeitsstand des Datensatzes (nicht in diesem Repositorium); daraus entsteht die Veröffentlichungsfassung.

```
# 1. Datensatz neu bauen (im Arbeitsordner des Datensatzes)
python _intern/build.py
python _intern/eog_abdeckung_2026-11-24.py
python _intern/paket_veroeffentlichung.py
# 2. Karte neu bauen (hier); Argument = Ordner der Veröffentlichungsfassung
python src/baue_karte.py "<Pfad>/BKZ/Veroeffentlichung"
```
Meldet `baue_karte.py` einen Wert ohne MaStR-Nummer, die Zeile in `zuordnung_hand.csv` ergänzen. **Neuer MaStR-Stand** (z. B. jährlich): `python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip` (ca. 6 min), danach `baue_karte.py`. **Neue Gemeindegrenzen** (BKG, jährlich): `python src/gemeinden.py <DE_VG250.gpkg>`, danach `baue_karte.py`. Bei jeder neuen Fassung Version und Datum in `CITATION.cff`, README und `index.html` (`?v=`) anheben.

Voraussetzung: Python 3.11+ mit `lxml` und `shapely`. `rohdaten/` (MaStR-Export, BKG-Download) ist nicht im Repositorium. Lokal ansehen: `python -m http.server 8000`, dann http://localhost:8000.
