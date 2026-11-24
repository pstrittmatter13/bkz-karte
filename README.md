# BKZ-Karte

**Baukostenzuschüsse für Netzanschlüsse oberhalb der Niederspannung in Deutschland**<br>
**je Gemeinde und Netzebene**

Karte öffnen: **https://pstrittmatter13.github.io/bkz-karte/**<br>
Stichtag 24.11.2026 · Version 1.0.0

Netzbetreiber verlangen beim Anschluss an Hoch- oder Mittelspannung einen Baukostenzuschuss (BKZ) je Kilowatt. Die Karte zeigt, wie hoch er wo ist.

- **329 Werte von 124 Netzbetreibern**<br>
  jeder aus dem veröffentlichten Preisblatt, mit Fundstelle und SHA-256-Prüfsumme
- **75,8 %** – Anteil dieser Netzbetreiber an den Erlösobergrenzen 2026 aller 808 Netzbetreiber
- **Median in €/kW netto:** HS 110,0 · HS/MS 113,0 · MS 125,5 · MS/NS 122,0

## Was die Karte zeigt

- **Karte:** jede Gemeinde in der Farbe des BKZ ihres Netzbetreibers auf der gewählten Ebene (HS, HS/MS, MS, MS/NS).
- **Klick oder Suche:** zuständiger Netzbetreiber, alle seine BKZ-Werte, Rechenmethode, Gültigkeit, Link zum Preisblatt.
- **Tabelle:** alle 124 Netzbetreiber mit Wert, sortier- und filterbar, als CSV.
- **Grau:** kein Wert veröffentlicht oder Netzbetreiber nicht eindeutig – es wird nichts geschätzt.

## Grenzen

- **Nur die größeren Netzbetreiber.** Durchsucht wurden die Netzbetreiber nach Größe bis 90 % der Erlösobergrenzen; die übrigen rund 680 meist kleinen Netzbetreiber (24,2 %) sind nicht erhoben. Keine Zufallsstichprobe.
- **Werte wie veröffentlicht:** netto, am Stichtag gültig, mit pauschalen Abschlägen; ohne Speicher- und Flexrabatte.
- **Mediane je Netzbetreiber:** jeder zählt einmal, unabhängig von Größe oder Fläche.

Alle Regeln und Ausschlüsse: [Datensatz-README](datensatz/README.md).

## Wie Datensatz und Karte entstanden sind

**Werte erheben**
1. **Auswahl:** alle 808 Stromverteilnetzbetreiber der BNetzA-Liste der Erlösobergrenzen 2026, nach Größe sortiert; durchsucht bis 90 % der Erlösobergrenzen (234 Netzbetreiber).
2. **Suche:** Website jedes Netzbetreibers (Netzanschluss, Preise, Downloads) und Websuche nach dem Preisblatt; ein zweiter Durchgang für alle ohne Fund. Seiten, die automatische Abrufe sperren, wurden im Browser von Hand geladen.
3. **Erfassung:** jedes Preisblatt als Datei gesichert und mit SHA-256-Prüfsumme festgehalten; Werte netto in der Einheit des Blatts übernommen, Netzebene vereinheitlicht, Rechenmethode, Abschläge und Speicherregeln aus dem Text kodiert.
4. **Regeln:** Ein Wert zählt, wenn das Blatt am Stichtag 24.11.2026 gilt, der Wert im Original nachgelesen ist und eindeutig einer Ebene oberhalb der Niederspannung gehört; jeder Ausschluss ist mit Grund vermerkt.
5. **Prüfung:** Stichprobe von 40 Werten durch den Autor; zwei unabhängige Prüfungen von zusammen 60 zufällig gezogenen Dokumenten gegen das Original, mit vorab festgelegten Fehlerarten (0 Fehler bei Wert, Einheit und Netzebene; Fehler in Zusatzangaben und ein übersehenes Preisblatt wurden korrigiert); danach Nachsuche bei den größten Netzbetreibern ohne Wert; Regelprüfung per Skript.

**Karte bauen**

6. **Netzbetreiber je Gemeinde:** aus dem Marktstammdatenregister (8,2 Mio. Anlagen in Betrieb) gezählt, an welchen Netzbetreiber die Anlagen einer Gemeinde auf welcher Spannungsebene angeschlossen sind; zuständig ist der mit den meisten Anschlüssen.
7. **Verknüpfen:** Netzbetreiber im Datensatz und im Register über die Registernummer; Gemeindegrenzen vom BKG.
8. **Seite:** statisches HTML, vollständig aus den Skripten in `src/` erzeugt – derselbe Stand ergibt dieselbe Karte.

## Woher jeder Wert kommt

Jeder Wert lässt sich bis zum Preisblatt zurückverfolgen. Im Datensatz steht zu jedem Wert die Adresse des Preisblatts beim Netzbetreiber und eine Prüfsumme (SHA-256) der Datei, die ausgewertet wurde. Wer das Preisblatt selbst lädt, kann so prüfen, ob es genau dieses Dokument ist.

| Schritt | Datei |
|---|---|
| Wert, Ebene, Einheit, Methode | `datensatz/bkz_werte_lang.csv` |
| Preisblatt: Adresse, Fundort, Gültigkeit | `datensatz/bkz_quellen.csv` |
| Prüfsumme der ausgewerteten Datei | `datensatz/download_log.csv` |

Die Preisblätter selbst liegen beim Netzbetreiber (die Rechte liegen dort); die Karte verlinkt je Wert das Original und die Archivkopien in der [Wayback Machine](https://web.archive.org).

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

## Lizenz und Quellen

**Jeder darf Daten und Karte nutzen, weitergeben und verändern – auch kommerziell –, wenn der Urheber genannt wird** ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de)). Der Code steht unter MIT ([LICENSE](LICENSE)).

| | |
|---|---|
| Daten, Karte, Texte | © 2026 Paul Schneider-Strittmatter, CC BY 4.0 |
| BKZ-Werte | Preisblätter der Netzbetreiber, je Wert verlinkt; maßgeblich sind die Preisblätter |
| Netzbetreiber je Gemeinde | Bundesnetzagentur, [Marktstammdatenregister](https://www.marktstammdatenregister.de/MaStR/Datendownload), Export 24.11.2026, [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0); Daten verändert |
| Gemeindegrenzen | © [BKG](https://www.bkg.bund.de) (2026) [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), Datenquellen: [datenquellen_vg_nuts.pdf](https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf); Daten verändert |
| Erlösobergrenzen 2026 | Bundesnetzagentur, Veröffentlichung nach § 23b EnWG |

## Dateien

| Ordner / Datei | Inhalt |
|---|---|
| `index.html`, `assets/` | die Seite |
| `datensatz/` | BKZ-Datensatz mit eigenem [README](datensatz/README.md) (Codebuch, Regeln, Prüfung) |
| `data/` | Kartendaten: `karte.json`, Zählung aus dem Marktstammdatenregister, Gemeindegrenzen |
| `src/` | Skripte, die `data/` erzeugen |
| `zuordnung_hand.csv` | Ausnahmen beim Abgleich Datensatz ↔ Marktstammdatenregister |
| `METHODIK.md` · `CITATION.cff` · `LICENSE` | Methodik · Zitierangaben · Lizenzen |

## Aktualisieren

In `data/` und `datensatz/` wird nichts von Hand geändert – alles entsteht aus dem Datensatz und den Skripten.

**Neues oder geändertes Preisblatt** (z. B. Blätter 2027 ab Dezember):

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

- **Marktstammdatenregister** (z. B. jährlich): [Gesamtdatenexport](https://www.marktstammdatenregister.de/MaStR/Datendownload) nach `rohdaten/` laden (≈ 3,3 GB), dann `python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip` (≈ 6 min) und `baue_karte.py`.
- **Gemeindegrenzen** (BKG, jährlich): [VG250-EW](https://gdz.bkg.bund.de) als GeoPackage laden, `python src/gemeinden.py <DE_VG250.gpkg>`, dann `baue_karte.py`.
- Meldet `baue_karte.py` einen Wert ohne MaStR-Nummer: Zeile in `zuordnung_hand.csv` ergänzen.
- Voraussetzung: Python 3.11+ mit `lxml` und `shapely`; `rohdaten/` ist nicht im Repositorium.
</details>

---

<sub>**Hinweis zu den Netzgebieten:** Netzgebietsgrenzen werden nicht amtlich veröffentlicht. Zuständig ist auf der Karte der Netzbetreiber, an den laut Marktstammdatenregister die meisten Anlagen der Gemeinde angeschlossen sind; Gemeinden mit mehreren Netzbetreibern erscheinen beim überwiegenden. Das HS-Netz wird nur bei klarer Mehrheit zugeordnet – in Gegenden, in denen kaum Anlagen direkt an der Hochspannung hängen (z. B. Raum Tuttlingen–Rottweil), bleibt es offen. Einzelheiten: [METHODIK.md](METHODIK.md).<br>
Entstanden im Rahmen einer Bachelorarbeit an der HTWG Konstanz, mit Unterstützung des KI-Assistenten Claude (Anthropic) unter Anleitung und Verantwortung des Autors. Jeder Wert ist am Original geprüft (Stichprobe und zwei KI-Prüfungen ohne Wertfehler; Einzelheiten im Datensatz-README, Abschnitt 3.5). Fehler gefunden? → [Issue anlegen](https://github.com/pstrittmatter13/bkz-karte/issues)</sub>
