# Aktualisierung

Anleitung zur Pflege von Datensatz und Karte. Für die Nutzung der Daten nicht erforderlich.

## Neues oder geändertes Preisblatt

1. **Preisblatt sichern:** als PDF speichern (Webseiten als PDF drucken), Adresse und Abrufdatum notieren.
2. **Werte erfassen:** je Netzebene Wert (netto), Einheit, Gültigkeitsbeginn und Rechenweg laut Blatt. Die Erfassung erfolgt im Arbeitsordner des Datensatzes, nicht in diesem Repositorium.
3. **Neu erzeugen:** zuerst den Datensatz, dann die Karte; die Skripte prüfen dabei die Aufnahmeregeln. Anschließend Version und Datum anheben.

Befehle:

```
# Datensatz (Arbeitsordner)
python _intern/build.py
python _intern/eog_abdeckung_2026-11-24.py
python _intern/paket_veroeffentlichung.py      # meldet Regelverstöße (pruefung.py)

# Karte (dieses Repositorium)
python src/baue_karte.py "<Pfad>/BKZ/Veroeffentlichung"
python -m http.server 8000                     # Ansicht: http://localhost:8000
```

Dateiname des Preisblatts: `BKZnnn_<Netzbetreiber>_<Jahr>_BKZ.pdf`; neue Jahre als neue Zeile in `_intern/records.jsonl`. Version und Datum stehen in `CITATION.cff`, `README.md` und `index.html` (`?v=`). Die Ordner `data/` und `datensatz/` werden ausschließlich von den Skripten geschrieben.

## Neuer Stand des Marktstammdatenregisters

1. [Gesamtdatenexport](https://www.marktstammdatenregister.de/MaStR/Datendownload) nach `rohdaten/` laden (≈ 3,3 GB; der Ordner ist nicht Teil des Repositoriums).
2. `python src/netzbetreiber_gemeinde.py rohdaten/Gesamtdatenexport_<datum>_<version>.zip` (≈ 6 min), danach `python src/baue_karte.py …`.

## Neue Gemeindegrenzen

1. [VG250-EW](https://gdz.bkg.bund.de) des BKG als GeoPackage laden.
2. `python src/gemeinden.py <DE_VG250.gpkg>`, danach `python src/baue_karte.py …`.

## Hinweise

- Meldet `baue_karte.py` einen Wert ohne MaStR-Nummer, wird die Zuordnung in `zuordnung_hand.csv` ergänzt.
- Voraussetzung: Python 3.11 oder neuer mit `lxml` und `shapely`.
