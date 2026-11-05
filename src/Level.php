<?php

final class Level implements JsonSerializable
{
    private $number;
    private $name;
    private $sky;
    private $platforms;
    private $scrolls;
    private $enemies;

    /** @param Enemy[] $enemies */
    public function __construct(
        int $number,
        string $name,
        array $sky,
        array $platforms,
        array $scrolls,
        array $enemies
    ) {
        $this->number = $number;
        $this->name = $name;
        $this->sky = $sky;
        $this->platforms = $platforms;
        $this->scrolls = $scrolls;
        $this->enemies = $enemies;
    }

    public function jsonSerialize(): array
    {
        return [
            'number' => $this->number,
            'name' => $this->name,
            'sky' => $this->sky,
            'platforms' => $this->platforms,
            'scrolls' => $this->scrolls,
            'enemies' => $this->enemies,
        ];
    }
}
