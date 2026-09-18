# Technische Dokumentation

Die drei Seiten sind `index.html` (Pyramiden und Navigation),
`kegelschnitt_ellipse_begrenzt.html` (Kegelschnitt) und `wortgeflecht.html`.
Sie verwenden native ES-Module
ohne Build-Schritt. Zum lokalen Öffnen ist ein HTTP-Server erforderlich:

```sh
npm ci
npm start
```

Danach sind alle Seiten unter `http://127.0.0.1:4173/` erreichbar.
Three.js bleibt in allen Importmaps auf Version **0.180.0** festgelegt.
Die öffentliche Darstellung lädt Three.js weiterhin von jsDelivr.

### Aufbau

- `pyramids/` und `ellipse/`: jeweils `config.js` für Vorgaben,
  `geometry.js` für Berechnungen, `model.js` für Three.js-Objekte,
  `status.js` für die Template-Anzeige und `main.js` für Zustand und DOM-Ereignisse.
- `shared/`: gemeinsame Ansicht mit Orbit-Steuerung, Kameraeinrahmung,
  rekursive Ressourcenfreigabe und Template-Bindung.
- `word-network/`: `graph.js` normalisiert die Eingaben und bildet Ketten sowie
  Raumverbindungen; `simulation.js` berechnet das Federnetz; `model.js` zeichnet
  Ebenen und Linien und bindet Wort-Templates über Three.js CSS2DRenderer ein.
  `interaction.js` verarbeitet Pointer-Capture und Tastaturbewegungen.
  `main.js` hält Zustand, DOM-Bindung und Renderzyklus. Vorgaben liegen in `config.js`.
- `styles/`: separate Stylesheets der beiden Seiten.
- HTML-Dateien: Seitenstruktur, deutsche Beschriftungen und Status-Templates.
  Es gibt vorerst keine Lokalisierung und keine Übersetzungsinfrastruktur.

Die Modellmodule erhalten ihre Szene explizit; Statusmodule erhalten Container
und Template. Berechnungen greifen nicht auf das DOM zu. Beim Neuaufbau werden
alte Geometrien und Materialien einschließlich verschachtelter Kanten freigegeben.
Die maximale Schnitthöhe wird bei steilen Ebenen auch unterhalb der ursprünglichen
Reglermindesthöhe begrenzt, damit die Ellipse vollständig auf dem endlichen Kegel liegt.
Die gemeinsame Kameraeinrahmung hält auch den Kegel in schmalen Ansichten vollständig sichtbar.

### Wortgeflecht

Die Felder X, Y und Z gehören zu XY-, YZ- und XZ-Ebene. Leerraum trennt Wörter.
NFC-Normalisierung und deutsche Kleinschreibung bestimmen ihre Identität; angezeigt
wird die erste eingegebene Schreibweise. Satzzeichen bleiben Bestandteil des Wortes.
Pro Ebene entsteht ein Knoten je unterschiedlichem Wort, höchstens 60. Bei längeren
Listen erscheint ein Hinweis. Die Texte selbst bleiben vollständig erhalten.
Die Eingabe wird nach 200 ms Ruhe neu aufgebaut; bestehende Verformungen werden dabei zurückgesetzt.

Innerhalb einer Ebene werden die Wörter in Eingabereihenfolge verbunden. Derselbe
Begriff auf verschiedenen Ebenen erhält paarweise gestrichelte Raumverbindungen.
Die Anfangslängen aller Kanten bilden die Ruhelängen des Federnetzes. Eine schwache
Rückstellkraft und Dämpfung stabilisieren die übrigen Knoten; die Simulation verwendet
begrenzte Teilschritte und überspringt lange Pausen, damit Hintergrundtabs keine
instabilen Kräfte erzeugen.

Ziehen erfolgt auf einer zur Kamera parallelen Ebene durch den Knoten. Durch Drehen
der Ansicht lässt sich anschließend aus einer anderen Richtung weiterziehen.
Der bewegte Knoten bleibt fixiert. Pfeiltasten verschieben fokussierte Knoten in
derselben Bildschirmebene. Beim Bearbeiten eines Knotens stoppt die automatische
Rotation. Reset entfernt Fixierungen und Geschwindigkeiten, stellt die Originalpunkte
und Kamera wieder her und behält alle Eingaben. Es gibt keine Speicherung oder
Übermittlung der Eingabetexte; beim Neuladen erscheinen die HTML-Beispielwerte.

### Prüfungen

```sh
npm test
npm run check
npx playwright install chromium
npm run test:browser
npm run format:check
```

Die Unit-Tests prüfen Exportverträge, Berechnungen, Grenzfälle, Kameraeinrahmung
und Ressourcenfreigabe sowie Normalisierung, Kettenbildung und Federverhalten.
Die Browsertests laden alle Einstiegsmodule bei Desktop-
und Mobilgröße, sammeln `pageerror`-Ereignisse und prüfen Regler, Moduswechsel,
Reset, Animation, DOM-Templates, Wortknoten-Ziehen, Tastaturbedienung und Layoutgeometrie. Screenshots entstehen unter
`test-results/`. Für reproduzierbare Tests werden ausschließlich die CDN-Anfragen
für Three.js auf die lokal installierte identische Version umgeleitet; die
Erreichbarkeit des öffentlichen CDN wird damit nicht getestet.

Optional kann `PLAYWRIGHT_CHROMIUM_EXECUTABLE` auf ein bereits installiertes
Chromium-Testprogramm zeigen. Die produktiven Seiten benötigen weder Node.js noch
die Testabhängigkeiten. Bei einer Veröffentlichung müssen die HTML-Dateien und
alle referenzierten Modul- und CSS-Verzeichnisse zusammen hochgeladen werden.
