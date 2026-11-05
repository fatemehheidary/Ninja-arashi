<?php

final class Enemy implements JsonSerializable
{
    private $type;
    private $x;
    private $health;
    private $speed;

    public function __construct(string $type, int $x, int $health, int $speed)
    {
        $this->type = $type;
        $this->x = $x;
        $this->health = $health;
        $this->speed = $speed;
    }

    public function jsonSerialize(): array
    {
        return [
            'type' => $this->type,
            'x' => $this->x,
            'health' => $this->health,
            'speed' => $this->speed,
        ];
    }
}
