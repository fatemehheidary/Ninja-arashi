<?php
$levels = require __DIR__ . '/levels.php';
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Ninja Arashi</title>
<style>
:root{--bg:#f3efe6;--fg:#1b1b1b;--card:#fff;--bd:#cfc7b4;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15171c;--fg:#eee;--card:#22252c;--bd:#3a3e48}}
:root[data-theme="dark"]{--bg:#15171c;--fg:#eee;--card:#22252c;--bd:#3a3e48}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;background:var(--bg);color:var(--fg);font-family:system-ui,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;padding:10px}
h1{margin:6px 0;font-size:22px}
canvas{width:100%;max-width:800px;border:2px solid var(--bd);border-radius:8px;background:#000;touch-action:none}
.help{max-width:800px;width:100%;background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:8px 12px;margin-top:8px;font-size:14px;box-sizing:border-box}
.pad{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center}
.pad button{font-size:22px;width:62px;height:52px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);touch-action:none;user-select:none}
</style>
</head>
<body>
<h1>🥷 Ninja Arashi</h1>
<canvas id="g" width="800" height="400"></canvas>
<div class="pad">
<button data-k="ArrowLeft">◀</button><button data-k="ArrowRight">▶</button>
<button data-k="Space">⤒</button><button data-k="KeyX">⚔</button><button data-k="KeyC">★</button><button data-k="Enter">⏎</button>
</div>
<div class="help">← → Laufen · Leertaste Springen · X Schwert · C Spezialangriff · Enter Start/Neustart</div>
<script id="level-data" type="application/json"><?= json_encode($levels, JSON_HEX_TAG | JSON_THROW_ON_ERROR) ?></script>
<script src="js/game.js"></script>
</body>
</html>
