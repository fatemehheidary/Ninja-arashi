<?php
$levels = require __DIR__ . '/levels.php';
?>
<!doctype html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#121426">
    <title>Ninja Arashi – Schattenpfad</title>
    <link rel="stylesheet" href="css/game.css">
</head>
<body>
<main id="game">
    <canvas id="g" aria-label="Spielfeld von Ninja Arashi"></canvas>
    <header class="hud">
        <div class="hud-left">
            <div class="eyebrow" id="level-number">LEVEL 01 / 10</div>
            <div id="level-name">Bambuswald</div>
            <div class="meters">
                <div class="health" role="meter" aria-label="Lebenspunkte" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span id="health-bar"></span></div>
                <div id="health-label">100 HP</div>
            </div>
        </div>
        <div class="hud-right">
            <div id="score">0 PUNKTE</div>
            <div id="remaining">3 Gegner übrig</div>
            <button type="button" id="pause" aria-label="Pause"></button>
            <button type="button" id="fullscreen" aria-label="Vollbild umschalten" aria-pressed="false" title="Vollbild umschalten">⛶</button>
        </div>
        <div class="route" aria-hidden="true"><span id="progress"></span></div>
        <div id="notice" class="notice" role="status" hidden></div>
    </header>

    <section id="overlay" class="overlay" aria-labelledby="screen-title">
        <div class="panel">
            <p id="screen-tag" class="eyebrow">10 LEVEL · 2 FÄHIGKEITEN</p>
            <h1 id="screen-title">Ninja Arashi</h1>
            <p id="screen-text">Durchquere den Schattenpfad. Besiege alle Gegner, um das nächste Tor zu öffnen.</p>
            <button type="button" id="screen-action">Spiel starten</button>
            <p class="keyboard-help">← → Laufen · Leertaste Springen · X Schwert · C Spezialangriff · Esc Pause</p>
            <p class="touch-help">Pfeile zum Laufen · ⬆ Springen · ⚔ Schwert · ✦ Spezialangriff</p>
        </div>
    </section>

    <footer class="controls" aria-label="Touch-Steuerung">
        <div class="direction">
            <button type="button" data-key="ArrowLeft" aria-label="Links">◀</button>
            <button type="button" data-key="ArrowRight" aria-label="Rechts">▶</button>
        </div>
        <div class="actions">
            <button type="button" data-key="ShiftLeft" id="dash" aria-label="Dash" hidden>➜</button>
            <button type="button" data-key="KeyC" id="special" aria-label="Spezialangriff">✦</button>
            <button type="button" data-key="KeyX" aria-label="Schwert">⚔</button>
            <button type="button" data-key="Space" aria-label="Springen">⬆</button>
        </div>
    </footer>
    <aside class="abilities" aria-label="Fähigkeiten">
        <span id="dash-status" hidden>⇧ Dash</span>
        <span id="jump-status" hidden>⤒ Doppelsprung</span>
        <span id="special-status">C Spezialangriff</span>
    </aside>
</main>
<script id="level-data" type="application/json"><?= json_encode($levels, JSON_HEX_TAG | JSON_THROW_ON_ERROR) ?></script>
<script src="js/game.js" type="module"></script>
</body>
</html>
