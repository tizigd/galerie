# Galerie – Bilder und Videos

Eine kleine Bilder- und Video-Galerie, bei der die Zuschauerin oder der Zuschauer selbst
entscheidet, wann es weitergeht.

## Bedienung

- **Enter**: nächstes Bild oder Video
- **←** / **→**: zurück / weiter
- **Weiter**-Button: dasselbe wie Enter
- **Link teilen**: kopiert die aktuelle Adresse inklusive Medium, z. B. `...#3`
  (auf dem Handy öffnet sich der System-Teilen-Dialog)

## Technik

Reines HTML, CSS und JavaScript – kein Build-Schritt, keine externen Bibliotheken.

```
index.html      Aufbau der Galerie
galerie.css     Gestaltung (responsiv, Reduced Motion)
galerie.js      Enter-Steuerung, Video-Handling, Teilen-Link
media/          Bilder, Videos und Poster
```

## Medien

Die Bilder sind Platzhalter aus dem Kurs. Die beiden Beispielvideos stammen von
MDN (CC0 bzw. gemeinfreies Filmmaterial). Eigene Medien können in `media/` gelegt und
in `index.html` verlinkt werden.
