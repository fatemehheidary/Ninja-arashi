<?php

require_once __DIR__ . '/src/Enemy.php';
require_once __DIR__ . '/src/Level.php';

return [
    new Level(
        1,
        'Bambuswald',
        ['#2a1f4d', '#d9776b'],
        [
            ['x' => 300, 'y' => 270, 'width' => 130],
        ],
        [
            ['x' => 340, 'y' => 240],
        ],
        [
            new Enemy('patrol', 520, 50, 2),
        ]
    ),
    new Level(
        2,
        'Tempel',
        ['#102a43', '#486581'],
        [
            ['x' => 180, 'y' => 270, 'width' => 120],
            ['x' => 430, 'y' => 200, 'width' => 130],
        ],
        [
            ['x' => 220, 'y' => 240],
            ['x' => 480, 'y' => 170],
        ],
        [
            new Enemy('patrol', 420, 50, 2),
            new Enemy('thrower', 730, 40, 0),
        ]
    ),
    new Level(
        3,
        'Shogun-Burg',
        ['#2b0a0a', '#8a2d2d'],
        [
            ['x' => 130, 'y' => 270, 'width' => 100],
            ['x' => 350, 'y' => 200, 'width' => 100],
            ['x' => 570, 'y' => 270, 'width' => 100],
        ],
        [
            ['x' => 165, 'y' => 240],
            ['x' => 385, 'y' => 170],
            ['x' => 605, 'y' => 240],
        ],
        [
            new Enemy('patrol', 420, 80, 3),
            new Enemy('thrower', 660, 60, 0),
            new Enemy('thrower', 745, 60, 0),
        ]
    ),
];
