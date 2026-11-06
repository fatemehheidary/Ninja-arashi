# Ninja Arashi – Schattenpfad

Ein 2D-Browserspiel mit zehn Levels. PHP erstellt die Level und Gegner als Objekte. JavaScript steuert das Spiel und zeichnet es im Canvas.

## Start mit XAMPP

1. Die ZIP-Datei entpacken.
2. Den Ordner `Ninja-Arashi` nach `C:\xampp\htdocs\` kopieren. Wenn dort bereits eine Version liegt, den neuen Ordner zum Beispiel `Ninja-Arashi-10-Level` nennen.
3. Apache im XAMPP Control Panel starten.
4. Im Browser `http://localhost/Ninja-Arashi/` öffnen. Bei einem anderen Ordnernamen die URL entsprechend anpassen.

Voraussetzungen sind PHP ab 7.3 und ein aktueller Browser. Eine Datenbank ist nicht nötig.

## Steuerung

| Aktion | Tastatur | Touch |
| --- | --- | --- |
| Laufen | Pfeiltasten links und rechts | ◀ und ▶ |
| Springen | Leertaste | ⬆ |
| Schwert | X | ⚔ |
| Spezialangriff | C | ✦ |
| Dash ab Level 4 | Umschalttaste | ➜ |
| Doppelsprung ab Level 8 | In der Luft erneut Leertaste drücken | In der Luft erneut ⬆ tippen |
| Pause | Esc | Ⅱ |

Das Spiel nutzt die gesamte Browserfläche. Über die Schaltfläche ⛶ lässt sich der Vollbildmodus aktivieren, wenn der Browser ihn anbietet.

## Spielregeln

- Besiege alle Gegner und gehe durch das Tor am rechten Ende der Strecke. Die Strecken werden mit jedem Level um 240 Spieleinheiten länger.
- Schriftrollen bringen Punkte und stellen Lebenspunkte wieder her. Beim Eintritt in ein neues Level starten die Lebenspunkte wieder bei 100.
- Schildgegner reduzieren den Schaden von Schwerthieben von vorn. Der Spezialangriff funktioniert auch gegen den Schild.
- Bei Game Over kannst du das aktuelle Level wiederholen. Die Punkte und Fähigkeiten vom Beginn dieses Levels bleiben erhalten.
- Der Endboss wartet in Level 10.

## Projektstruktur

| Datei | Aufgabe |
| --- | --- |
| `index.php` | Lädt die Level und gibt die HTML-Seite samt Leveldaten als JSON aus |
| `levels.php` | Erstellt die zehn `Level`-Objekte und ihre `Enemy`-Objekte |
| `src/Level.php`, `src/Enemy.php` | PHP-Klassen für die Level- und Gegnerdaten |
| `js/game.js` | Steuerung, Spielfigur, Gegner, Kampf und Levelwechsel |
| `js/view.js` | Kamera, Grafik und Animationen |
| `css/game.css` | Layout, Vollbildfläche und Touch-Steuerung |
