# Galerie – Bilder und Videos

Eine kleine Galerie, bei der die Zuschauerin oder der Zuschauer selbst entscheidet, wann es
weitergeht.

## Bedienung

- **Enter**: nächstes Bild oder Video
- **←** / **→**: zurück / weiter
- **Weiter**-Button: dasselbe wie Enter
- **F** oder Button oben rechts: Vollbild
- **Wischen** (Touch): zurück / weiter
- **Link teilen**: kopiert die aktuelle Adresse inklusive Medium, z. B. `...#3`
  (oder öffnet auf dem Handy den System-Share-Dialog)

## Vollbild

Im Vollbild bleiben alle Steuerungen verfügbar:

- **Enter** oder **→**: nächstes Medium
- **←**: zurück
- **Buttons** am unteren Rand: zurück / weiter
- **Wischen**: zurück / weiter
- **Esc**, **F** oder der Button oben rechts: Vollbild beenden

## Bearbeiten (lokal im Browser)

1. Auf **„Bearbeiten“** klicken.
2. Bilder/Videos per **Drag & Drop** auf die Seite ziehen oder **„Dateien hinzufügen“** wählen.
3. Die Reihenfolge am Griff **⋮⋮** per Ziehen ändern.
4. **„Fertig“** – gespeichert wird nur in diesem Browser (IndexedDB + localStorage).
5. **„Zurücksetzen“** stellt die veröffentlichte Version wieder her.

Das ist eine lokale Bearbeitung: Andere Besucher sehen die Änderungen nicht, bis die
Galerie exportiert und veröffentlicht wird.

## Exportieren

Im Bearbeiten-Modus:

- **„Als ZIP exportieren“** erzeugt ein vollständiges Paket mit `index.html`,
  `galerie.css`, `galerie.js`, `galerie.json`, `media/`, `README.md` und `.nojekyll`.
- **„Nur galerie.json“** exportiert nur die Liste. Neu hinzugefügte Medien sind dann
  **nicht** enthalten – dafür das ZIP verwenden.

ZIP entpacken und die Dateien ins GitHub-Repository legen (oder bei Netlify Drop
hochladen). Danach ist die bearbeitete Galerie für alle sichtbar.

## Dateien

```
galerie/
├── index.html      Aufbau der Galerie
├── galerie.css     Gestaltung
├── galerie.js      Galerie, Editor, Export
├── galerie.json    Liste der Medien und Reihenfolge
└── media/          Bilder, Videos und Poster
```

## Eigene Medien einsetzen

Am einfachsten im Bearbeiten-Modus per Drag & Drop oder über **„Dateien hinzufügen“**.

Manuell:

1. Bilder/Videos in den Ordner `media/` legen.
2. In `galerie.json` einen Eintrag ergänzen mit `typ`, `src`, `poster`, `titel`, `art`
   und `alt`.
3. Die Reihenfolge im JSON entspricht der Reihenfolge in der Galerie.

## Link

**Dauerhafter Link:** <https://tizigd.github.io/galerie/>

Der Link liegt auch in [`LINK-ZUM-TEILEN.txt`](LINK-ZUM-TEILEN.txt). Doppelklick auf
[`Link zur Galerie.webloc`](<Link zur Galerie.webloc>) öffnet ihn direkt im Browser. Der
QR-Code zum Scannen mit dem Handy liegt unter [`media/qr-link.png`](media/qr-link.png).

Der Link bleibt dauerhaft und funktioniert auch, wenn dieser Mac aus ist.

## Teilen

Einfach **https://tizigd.github.io/galerie/** weitergeben. Der Button **„Link teilen“**
kopiert die aktuelle Adresse inklusive Medium, z. B.
`https://tizigd.github.io/galerie/#3`.

Lokal testen:

```bash
cd galerie
python3 -m http.server 8000
```

Dann `http://localhost:8000/` öffnen – das ist nur auf diesem Mac verfügbar.

GitHub-Repository: <https://github.com/tizigd/galerie>
