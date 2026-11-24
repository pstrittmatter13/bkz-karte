# BKZ-Karte

**Baukostenzuschüsse für Netzanschlüsse oberhalb der Niederspannung in Deutschland – je Gemeinde und Netzebene**

### [→ Karte öffnen](https://pstrittmatter13.github.io/bkz-karte/) · Stichtag 24.11.2026 · Version 1.0.0

Netzbetreiber verlangen beim Anschluss an Hoch- oder Mittelspannung einen Baukostenzuschuss (BKZ) je Kilowatt. Diese Karte zeigt, wie hoch er wo ist – und belegt jeden Wert mit dem Preisblatt des Netzbetreibers.

| | |
|---|---|
| **329 Werte von 124 Netzbetreibern** | jeder aus dem veröffentlichten Preisblatt, mit Fundstelle und SHA-256-Prüfsumme |
| **75,8 %** | Anteil dieser Netzbetreiber an den Erlösobergrenzen 2026 aller 808 Netzbetreiber |
| **72 % der Einwohner** | wohnen in einer Gemeinde, für die ein Mittelspannungs-Wert vorliegt |
| **Median (€/kW netto)** | HS 110,0 · HS/MS 113,0 · MS 125,5 · MS/NS 122,0 |

---

## Was die Karte zeigt

- **Karte:** jede Gemeinde in der Farbe des BKZ ihres Netzbetreibers auf der gewählten Ebene (HS, HS/MS, MS, MS/NS).
- **Klick oder Suche:** zuständiger Netzbetreiber, alle seine BKZ-Werte, Rechenmethode, Gültigkeit, Link zum Preisblatt.
- **Tabelle:** alle 124 Netzbetreiber mit Wert, sortier- und filterbar, als CSV.
- **Grau:** kein Wert veröffentlicht oder Netzbetreiber nicht eindeutig – es wird nichts geschätzt.

## Grenzen – bitte vor der Verwendung lesen

| | |
|---|---|
| **Größere Netzbetreiber, keine Zufallsstichprobe** | Durchsucht nach Größe bis 90 % der Erlösobergrenzen. Die übrigen 24,2 % verteilen sich auf über 680 meist kleine Netzbetreiber, die selten einen Wert oberhalb der Niederspannung veröffentlichen. |
| **Netzgebiete sind genähert** | Netzgebietsgrenzen werden nicht amtlich veröffentlicht. Zuständig ist hier, wer laut Marktstammdatenregister die meisten Anlagen der Gemeinde anschließt. HS-Netz nur bei klarer Mehrheit ([Methodik](METHODIK.md)). |
| **Werte wie veröffentlicht** | netto, am Stichtag gültig, mit pauschalen Abschlägen; **ohne** Speicher- und Flexrabatte. €/kVA ohne Angabe mit cos φ = 1 umgerechnet. |
| **Mediane je Netzbetreiber** | jeder zählt einmal, unabhängig von Größe oder Fläche |
| **Prüfung** | jeder Wert am Original nachgelesen; Stichprobe und zwei KI-Prüfungen ohne Wertfehler; Prüfung durch eine weitere Person steht aus |

Alle Regeln, Ausschlüsse und eine Sensitivitätsrechnung: [Datensatz-README](datensatz/README.md).

## Jeden Wert nachprüfen

```
Wert in der Karte
  → datensatz/bkz_werte_lang.csv     Wert, Ebene, Einheit, Methode   (ID BKZnnn)
  → datensatz/bkz_quellen.csv        Preisblatt-URL, Fundort, Gültigkeit
  → datensatz/download_log.csv       gesicherte Datei mit SHA-256
  → Preisblatt beim Netzbetreiber    erneut laden, Prüfsumme vergleichen
```

**Wo liegen die Preisblätter?** Beim Netzbetreiber – die Karte verlinkt je Wert die Original-Adresse (Stand 24.11.2026) und die Archivkopien in der [Wayback Machine](https://web.archive.org). Die PDFs selbst sind nicht im Repositorium, weil die Rechte bei den Netzbetreibern liegen. Ob ein geladenes Preisblatt genau das ausgewertete ist, zeigt die SHA-256-Prüfsumme.

**Netzbetreiber je Gemeinde:** `data/mastr_zaehlung.csv` (Anlagen je Gemeinde, Ebene, Netzbetreiber) aus dem MaStR-Export, dessen Prüfsumme in `data/mastr_stand.json` steht; Regel in `src/baue_karte.py`.

## Zitieren

> Schneider-Strittmatter, P. (2026): *BKZ-Karte: Baukostenzuschüsse der Stromverteilnetzbetreiber oberhalb der Niederspannung in Deutschland, Stichtag 24.11.2026* (Version 1.0.0) [Datensatz und Karte]. https://github.com/pstrittmatter13/bkz-karte

<details><summary>BibTeX</summary>

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
</details>

Eine DOI (Zenodo) folgt; dann bitte mit DOI zitieren. GitHub zeigt die Angaben auch rechts unter „Cite this repository“.

## Lizenz und Quellen

| | |
|---|---|
| **Daten, Karte, Texte** | © 2026 Paul Schneider-Strittmatter, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de) |
| **Code** | MIT ([LICENSE](LICENSE)) |
| **BKZ-Werte** | Preisblätter der Netzbetreiber, je Wert verlinkt; maßgeblich sind die Preisblätter, keine Gewähr für Vollständigkeit |
| **Netzbetreiber je Gemeinde** | Bundesnetzagentur, [Marktstammdatenregister](https://www.marktstammdatenregister.de/MaStR/Datendownload), Gesamtdatenexport 24.11.2026, [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0); Daten verändert (Anlagen gezählt, Netzbetreiber abgeleitet) |
| **Gemeindegrenzen** | © [BKG](https://www.bkg.bund.de) (2026) [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), Datenquellen: [datenquellen_vg_nuts.pdf](https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf); VG250-EW, Stand 31.12.2025; Daten verändert (vereinfacht) |
| **Erlösobergrenzen 2026** | Bundesnetzagentur, Veröffentlichung nach § 23b EnWG |

Entstanden im Rahmen einer Bachelorarbeit an der HTWG Konstanz, mit Unterstützung des KI-Assistenten Claude (Anthropic) unter Anleitung und Verantwortung des Autors. Fehler gefunden? → [Issue anlegen](https://github.com/pstrittmatter13/bkz-karte/issues)

---

## Dateien

| Ordner / Datei | Inhalt |
|---|---|
| `index.html`, `assets/` | die Seite |
| `datensatz/` | BKZ-Datensatz mit eigenem [README](datensatz/README.md) (Codebuch, Regeln, Prüfung) |
| `data/` | Kartendaten: `karte.json`, MaStR-Zählung, Gemeindegrenzen |
| `src/` | Skripte, die `data/` erzeugen |
| `zuordnung_hand.csv` | Ausnahmen beim Abgleich Datensatz ↔ MaStR, mit Begründung |
| `METHODIK.md` · `CITATION.cff` · `LICENSE` | Methodik · Zitierangaben · Lizenzen |

## Aktualisieren

In `data/` und `datensatz/` wird nichts von Hand geändert – alles entsteht aus dem Datensatz und den Skripten.

**Neues oder geändertes Preisblatt** (häufigster Fall, z. B. Blätter 2027 ab Dezember):

1. Preisblatt suchen, als PDF speichern (Webseiten als PDF drucken).
2. Im Arbeitsordner des Datensatzes: PDF nach `PDFs/` als `BKZnnn_<Netzbetreiber>_<Jahr>_BKZ.pdf`, Eintrag in `_intern/records.jsonl` (Werte netto, Einheit, Gültigkeit, URL, Methode laut Blatt; neue Jahre als neue Zeile).
3. Datensatz neu bauen und prüfen:
   ```
   python _intern/build.py
   python _intern/eog_abdeckung_2026-11-24.py
   python _intern/paket_veroeffentlichung.py      # meldet Regelverstöße (pruefung.py)
   ```
4. Karte neu bauen, ansehen, veröffentlichen:
   ```
   python src/baue_karte.py "<Pfad>/BKZ/Veroeffentlichung"
   python -m http.server 8000                     # http://localhost:8000
   git add -A && git commit -m "…" && git push    # GitHub Pages aktualisiert sich selbst
   ```
5. Version und Datum in `CITATION.cff`, README und `index.html` (`?v=`) anheben.

<details><summary>Seltener: neuer MaStR-Stand oder neue Gemeindegrenzen</summary>

- **MaStR** (z. B. jährlich): [Gesamtdatenexport](https://www.marktstammdatenregister.de/MaStR/Datendownload) nach `rohdaten/` laden (≈ 3,3 GB), dann `python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip` (≈ 6 min) und `baue_karte.py`.
- **Gemeindegrenzen** (BKG, jährlich): [VG250-EW](https://gdz.bkg.bund.de) als GeoPackage laden, `python src/gemeinden.py <DE_VG250.gpkg>`, dann `baue_karte.py`.
- Meldet `baue_karte.py` einen Wert ohne MaStR-Nummer: Zeile in `zuordnung_hand.csv` ergänzen.
- Voraussetzung: Python 3.11+ mit `lxml` und `shapely`; `rohdaten/` ist nicht im Repositorium.
</details>
