<?php

final class Level implements JsonSerializable
{
    private $number;
    private $name;
    private $width;
    private $sky;
    private $accent;
    private $platforms;
    private $scrolls;
    private $enemies;

    /** @param Enemy[] $enemies */
    public function __construct(
        int $number,
        string $name,
        int $width,
        array $sky,
        string $accent,
        array $platforms,
        array $scrolls,
        array $enemies
    ) {
        $this->number = $number;
        $this->name = $name;
        $this->width = $width;
        $this->sky = $sky;
        $this->accent = $accent;
        $this->platforms = $platforms;
        $this->scrolls = $scrolls;
        $this->enemies = $enemies;
    }

    public function jsonSerialize(): array
    {
        return [
            'number' => $this->number,
            'name' => $this->name,
            'width' => $this->width,
            'sky' => $this->sky,
            'accent' => $this->accent,
            'platforms' => $this->platforms,
            'scrolls' => $this->scrolls,
            'enemies' => $this->enemies,
        ];
    }
}
