# Baukostenzuschüsse für Netzanschlüsse in Deutschland 2026

**Datensatz und Karte der Baukostenzuschüsse der Stromverteilnetzbetreiber oberhalb der Niederspannung**

Version 1.0.0 · Stichtag 24.11.2026 · [Karte öffnen](https://pstrittmatter13.github.io/bkz-karte/)

---

## Überblick

Wer eine Anlage an das Hoch- oder Mittelspannungsnetz anschließt, zahlt dem Netzbetreiber einen einmaligen Baukostenzuschuss (BKZ) je Kilowatt Anschlussleistung. Höhe und Berechnung legt jeder Netzbetreiber selbst fest und veröffentlicht sie in eigenen Preisblättern; eine bundesweite Übersicht gibt es bislang nicht.

Dieses Repositorium stellt die veröffentlichten Werte zusammen, belegt jeden Wert mit seiner Fundstelle und ordnet sie auf einer Karte den Gemeinden zu.

| Kennzahl | Wert |
|---|---|
| Werte | 332 von 125 Netzbetreibern |
| Abdeckung | 77,3 % der Erlösobergrenzen 2026 aller 808 Stromverteilnetzbetreiber |
| Median in €/kW (netto) | HS 109,8 · HS/MS 111,7 · MS 125,4 · MS/NS 122,0 |

HS = Hochspannung, MS = Mittelspannung, NS = Niederspannung; HS/MS und MS/NS bezeichnen die Umspannebenen.

## Methode

1. **Grundgesamtheit:** Gesucht wurde bei den Netzbetreibern, die zusammen 90 % der Erlösobergrenzen 2026 der Bundesnetzagentur auf sich vereinen (234 Netzbetreiber, mit Nachsuche 241).
2. **Erhebung:** Preisblätter wurden auf den Internetseiten der Netzbetreiber gesucht, als Datei gesichert und mit einer SHA-256-Prüfsumme versehen. Netzbetreiber ohne Fund wurden in einem zweiten Durchgang nach festem Protokoll erneut gesucht.
3. **Aufnahme:** Ein Wert wird aufgenommen, wenn das Preisblatt am Stichtag gilt, der Wert im Original nachgelesen ist und eindeutig einer Netzebene oberhalb der Niederspannung zugeordnet werden kann. Jeder Ausschluss ist mit Grund dokumentiert.
4. **Prüfung:** Eine Stichprobe von 40 Werten wurde vom Autor am Original geprüft, zwei weitere Prüfungen umfassten zusammen 60 zufällig gezogene Dokumente. Bei Wert, Einheit und Netzebene wurden keine Fehler gefunden; Fehler in Zusatzangaben wurden berichtigt.
5. **Karte:** Der zuständige Netzbetreiber je Gemeinde und Netzebene wird aus dem Marktstammdatenregister abgeleitet, für das Hochspannungsnetz ergänzend aus [VNBdigital](https://www.vnbdigital.de). Netzgebietsgrenzen werden nicht amtlich veröffentlicht.

Ausführlich: [Datensatz](datensatz/README.md) (Codebuch, Regeln, Prüfung) · [Karte](METHODIK.md) (Zuordnung der Netzbetreiber zu Gemeinden).

## Geltungsbereich und Grenzen

- **Größere Netzbetreiber:** Die rund 570 kleineren Netzbetreiber außerhalb der Grundgesamtheit wurden nicht erhoben. Die Auswahl ist keine Zufallsstichprobe; Aussagen gelten für die erhobenen Netzbetreiber.
- **Werte wie veröffentlicht:** netto, am Stichtag gültig, einschließlich pauschaler Abschläge. Sonderregeln für Speicher und flexible Netzanschlussvereinbarungen sind dokumentiert, aber nicht eingerechnet.
- **Kennzahlen je Netzbetreiber:** Jeder Netzbetreiber geht mit einem Wert je Netzebene ein, unabhängig von seiner Größe.
- **Keine Schätzung:** Gemeinden ohne aufgenommenen Wert bleiben grau. Dunkelgrau: gesucht, kein verwertbarer Wert (Grund in der Tabelle); hellgrau: nicht gesucht oder Netzbetreiber nicht eindeutig.
- **Zuordnung auf Gemeindeebene:** Teilen sich mehrere Netzbetreiber eine Gemeinde, zeigt die Karte den überwiegenden.

Maßgeblich ist stets das Preisblatt des Netzbetreibers.

## Inhalt

| Pfad | Inhalt |
|---|---|
| `datensatz/` | BKZ-Datensatz: Werte, Quellen, Suchprotokoll, Prüfstichprobe, Prüfsummen |
| `data/` | Kartendaten: Netzbetreiber je Gemeinde, Gemeindegrenzen |
| `src/` | Skripte, aus denen `data/` und die Karte vollständig erzeugt werden |
| `index.html`, `assets/` | Karte |
| `zuordnung_*.csv` | manuelle und VNBdigital-Zuordnungen mit Abrufdatum |

Pflege und Aktualisierung: [WARTUNG.md](WARTUNG.md).

## Zitierempfehlung

> Schneider-Strittmatter, P. (2026): *Baukostenzuschüsse der Stromverteilnetzbetreiber oberhalb der Niederspannung in Deutschland, Stichtag 24.11.2026.* Datensatz und Karte, Version 1.0.0. https://github.com/pstrittmatter13/bkz-karte

<details><summary>BibTeX</summary>

```bibtex
@misc{schneiderstrittmatter2026bkzkarte,
  author       = {Schneider-Strittmatter, Paul},
  title        = {Baukostenzuschüsse der Stromverteilnetzbetreiber oberhalb der Niederspannung in Deutschland, Stichtag 24.11.2026},
  year         = {2026},
  version      = {1.0.0},
  howpublished = {Datensatz und Karte},
  url          = {https://github.com/pstrittmatter13/bkz-karte}
}
```
</details>

## Lizenz und Quellen

| | |
|---|---|
| Daten, Karte, Texte | © 2026 Paul Schneider-Strittmatter, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de) |
| Programmcode | [MIT](LICENSE) |
| BKZ-Werte | Preisblätter der Netzbetreiber, je Wert verlinkt |
| Netzbetreiber je Gemeinde | Bundesnetzagentur, [Marktstammdatenregister](https://www.marktstammdatenregister.de/MaStR/Datendownload), Export 24.11.2026, [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0); Daten verändert |
| Gemeindegrenzen | © [BKG](https://www.bkg.bund.de) (2026), [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), Datenquellen: [datenquellen_vg_nuts.pdf](https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf); Daten verändert |
| Erlösobergrenzen 2026 | Bundesnetzagentur, Veröffentlichung nach § 23b EnWG |

## Entstehung und Kontakt

Erstellt im Rahmen einer Bachelorarbeit an der Hochschule Konstanz (HTWG). Bei Recherche, Erfassung und Programmierung wurde der KI-Assistent Claude (Anthropic) eingesetzt; Auswahl, Prüfung und Verantwortung liegen beim Autor. Hinweise auf Fehler oder neue Preisblätter bitte als [Issue](https://github.com/pstrittmatter13/bkz-karte/issues).

---

<sub>**English summary.** Grid connection charges (Baukostenzuschuss, BKZ) of German distribution system operators above low voltage, valid on 24 Nov 2026: 332 values from 125 operators covering 77.3 % of the 2026 revenue caps, each traced to the operator's published price sheet with checksum, and mapped to municipalities via the German market master data register. Data CC BY 4.0, code MIT.</sub>
