import { GameView, GROUND } from './view.js';

const STEP = 1 / 120;
const MAX_HEALTH = 100;
const ACTION_KEYS = ['ArrowLeft', 'ArrowRight', 'Space', 'KeyX', 'KeyC', 'ShiftLeft'];
const TAP_KEYS = ['Space', 'KeyX', 'KeyC', 'ShiftLeft'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const approach = (value, target, step) => value < target
    ? Math.min(value + step, target)
    : Math.max(value - step, target);

class Controls {
    constructor() {
        this.keyboard = new Set();
        this.pointers = new Map();
        this.pressed = new Set();

        window.addEventListener('keydown', event => {
            const key = event.code === 'ShiftRight' ? 'ShiftLeft' : event.code;
            if (!ACTION_KEYS.includes(key) || event.altKey || event.ctrlKey || event.metaKey) return;
            if (key === 'Space' && event.target instanceof HTMLButtonElement) return;
            event.preventDefault();
            if (TAP_KEYS.includes(key) && !event.repeat && !this.keyboard.has(key)) this.pressed.add(key);
            this.keyboard.add(key);
        });
        window.addEventListener('keyup', event => {
            this.keyboard.delete(event.code === 'ShiftRight' ? 'ShiftLeft' : event.code);
        });
        window.addEventListener('blur', () => this.clear());

        for (const button of document.querySelectorAll('[data-key]')) {
            button.addEventListener('pointerdown', event => {
                event.preventDefault();
                const key = button.dataset.key;
                if (TAP_KEYS.includes(key)) this.pressed.add(key);
                this.pointers.set(event.pointerId, key);
                button.setPointerCapture(event.pointerId);
            });
            for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                button.addEventListener(eventName, event => this.pointers.delete(event.pointerId));
            }
        }
    }

    held(key) {
        return this.keyboard.has(key) || [...this.pointers.values()].includes(key);
    }

    take(key) {
        return this.pressed.delete(key);
    }

    clear() {
        this.keyboard.clear();
        this.pointers.clear();
        this.pressed.clear();
    }
}

class Player {
    constructor() {
        this.x = this.lastX = 80;
        this.y = this.lastY = GROUND;
        this.vx = this.vy = 0;
        this.hp = MAX_HEALTH;
        this.face = 1;
        this.onGround = true;
        this.extraJumpUsed = false;
        this.hurtTime = 0;
        this.swordWait = this.specialWait = this.dashWait = 0;
        this.attackTime = this.dashTime = 0;
        this.attackKind = 'sword';
        this.stride = 0;
    }

    update(dt, game) {
        const input = game.input;
        this.lastX = this.x;
        this.lastY = this.y;
        for (const timer of ['hurtTime', 'swordWait', 'specialWait', 'dashWait', 'attackTime', 'dashTime']) {
            this[timer] = Math.max(0, this[timer] - dt);
        }

        const move = Number(input.held('ArrowRight')) - Number(input.held('ArrowLeft'));
        if (move && !this.dashTime) this.face = move;
        const dash = input.take('ShiftLeft');
        if (dash && game.hasDash && !this.dashWait) {
            this.dashTime = .17;
            this.dashWait = 1.25;
            game.burst(this.x - this.face * 10, this.y - 16, '#ffc994', 10);
        }
        const jump = input.take('Space');
        if (jump && (this.onGround || (game.hasDoubleJump && !this.extraJumpUsed))) {
            if (!this.onGround) {
                this.extraJumpUsed = true;
                game.burst(this.x, this.y, '#a3e7ff', 10);
            }
            this.vy = -495;
            this.onGround = false;
        }

        const speed = this.dashTime ? this.face * 620 : move * 290;
        this.vx = this.dashTime ? speed : approach(this.vx, speed, 2300 * dt);
        this.vy = this.dashTime ? Math.min(55, this.vy + 600 * dt) : this.vy + 1370 * dt;
        this.x = clamp(this.x + this.vx * dt, 18, game.level.width - 18);
        this.y += this.vy * dt;
        this.onGround = false;

        if (this.vy >= 0) {
            for (const platform of game.level.platforms) {
                if (this.lastY <= platform.y && this.y >= platform.y &&
                    this.x + 13 > platform.x && this.x - 13 < platform.x + platform.width) {
                    this.land(platform.y);
                    break;
                }
            }
            if (this.y >= GROUND) this.land(GROUND);
        }
        this.stride += Math.abs(this.vx) * dt * .055;

        const special = input.take('KeyC');
        const sword = input.take('KeyX');
        if ((special || input.held('KeyC')) && !this.specialWait) {
            this.specialWait = 2.6;
            this.attack('special', .35, 150, 42, game);
        } else if ((sword || input.held('KeyX')) && !this.swordWait) {
            this.swordWait = .27;
            this.attack('sword', .18, 66, 26, game);
        }
    }

    land(y) {
        this.y = y;
        this.vy = 0;
        this.onGround = true;
        this.extraJumpUsed = false;
    }

    attack(kind, duration, range, damage, game) {
        this.attackKind = kind;
        this.attackTime = duration;
        for (const foe of game.foes) {
            const dx = (foe.x - this.x) * this.face;
            if (foe.hp > 0 && dx >= -18 && dx <= range + foe.width / 2 &&
                Math.abs((foe.y - foe.height / 2) - (this.y - 24)) < (kind === 'special' ? 80 : 42)) {
                foe.hit(damage, kind, game);
            }
        }
        if (kind === 'special') game.burst(this.x + this.face * 25, this.y - 22, '#ffdc89', 16);
    }

    hurt(damage, game) {
        if (this.hurtTime || this.dashTime || this.hp <= 0) return;
        this.hp = Math.max(0, this.hp - damage);
        this.hurtTime = .78;
        game.burst(this.x, this.y - 26, '#ff647b', 13);
    }
}

const ENEMY_TYPES = {
    patrol: { width: 30, height: 48, color: '#f5cf85', damage: 12, range: 43, windup: .31, rest: .7 },
    thrower: { width: 32, height: 46, color: '#eda472', damage: 12, range: 400, windup: .48, rest: 1.15 },
    jumper: { width: 28, height: 43, color: '#bc92fb', damage: 14, range: 170, windup: .34, rest: .68 },
    shield: { width: 39, height: 51, color: '#87c6ca', damage: 16, range: 53, windup: .52, rest: .78 },
    boss: { width: 62, height: 80, color: '#f98e70', damage: 22, range: 110, windup: .62, rest: .85 },
};

class Foe {
    constructor(data, index) {
        const type = ENEMY_TYPES[data.type];
        Object.assign(this, type);
        this.type = data.type;
        this.x = this.lastX = this.home = data.x;
        this.y = this.lastY = GROUND;
        this.hp = this.maxHp = data.health;
        this.speed = data.speed;
        this.face = index % 2 ? 1 : -1;
        this.vx = this.vy = 0;
        this.attackTime = this.swingTime = this.flash = 0;
        this.cooldown = .28 + index % 3 * .15;
        this.walk = index * 1.7;
    }

    update(dt, game) {
        this.lastX = this.x;
        this.lastY = this.y;
        if (this.hp <= 0) return;
        const p = game.player;
        const distance = Math.abs(p.x - this.x);
        this.flash = Math.max(0, this.flash - dt);
        this.swingTime = Math.max(0, this.swingTime - dt);
        if (distance > 610 && this.y === GROUND) {
            this.attackTime = 0;
            return;
        }
        this.cooldown = Math.max(0, this.cooldown - dt);
        if (this.attackTime > 0) {
            this.attackTime -= dt;
            if (this.attackTime <= 0) {
                this.attackTime = 0;
                this.strike(game);
                this.cooldown = this.rest;
            }
        } else if (this.y === GROUND) {
            if (distance <= this.range && Math.abs(p.y - this.y) < 115) {
                this.face = p.x < this.x ? -1 : 1;
                this.vx = 0;
                if (!this.cooldown) this.attackTime = this.windup;
            } else if (distance < 315 && this.type !== 'thrower') {
                this.face = p.x < this.x ? -1 : 1;
                this.vx = this.face * this.speed;
            } else {
                if (this.x < this.home - 55 || this.x > this.home + 55) {
                    this.face = this.x < this.home ? 1 : -1;
                }
                this.vx = this.face * this.speed * .55;
            }
        }

        this.x = clamp(this.x + this.vx * dt, 170, game.level.width - 105);
        if (this.y < GROUND || this.vy < 0) {
            this.vy += 1180 * dt;
            this.y = Math.min(GROUND, this.y + this.vy * dt);
            if (this.y === GROUND) {
                this.vx = 0;
                this.vy = 0;
            }
        }
        this.walk += Math.abs(this.vx) * dt * .052;
        if (this.type === 'jumper' && this.y < GROUND &&
            Math.abs(p.x - this.x) < 31 && Math.abs(p.y - this.y) < 36) p.hurt(this.damage, game);
    }

    strike(game) {
        const p = game.player;
        if (this.type === 'thrower') {
            game.shots.push({ x: this.x + this.face * 18, y: this.y - 24, vx: this.face * 255, damage: this.damage });
        } else if (this.type === 'jumper') {
            this.vx = this.face * 238;
            this.vy = -375;
        } else {
            this.swingTime = .22;
            const dx = (p.x - this.x) * this.face;
            if (dx >= -19 && dx <= this.range + 12 && Math.abs(p.y - this.y) < 52) p.hurt(this.damage, game);
            if (this.type === 'boss') {
                game.shots.push({ x: this.x + this.face * 31, y: this.y - 18, vx: this.face * 330, damage: 15 });
            }
        }
    }

    hit(damage, kind, game) {
        const guarded = this.type === 'shield' && kind === 'sword' && !this.attackTime &&
            (game.player.x - this.x) * this.face > 0;
        this.hp = Math.max(0, this.hp - (guarded ? 8 : damage));
        this.flash = .15;
        game.burst(this.x, this.y - this.height * .5, guarded ? '#a6f4ff' : '#ffb38f', this.hp ? 5 : 18);
        if (!this.hp) {
            game.score += this.type === 'boss' ? 500 : 100;
            game.remaining--;
        }
    }
}

class Game {
    constructor(levels) {
        this.levels = levels;
        this.input = new Controls();
        this.view = new GameView(document.getElementById('g'));
        this.ui = Object.fromEntries([
            'game', 'overlay', 'screen-tag', 'screen-title', 'screen-text', 'screen-action', 'pause', 'fullscreen',
            'level-number', 'level-name', 'health-label', 'health-bar', 'score', 'remaining', 'progress',
            'notice', 'dash', 'dash-status', 'jump-status', 'special', 'special-status',
        ].map(id => [id, document.getElementById(id)]));
        this.state = 'ready';
        this.time = 0;
        this.score = 0;
        this.entryScore = 0;
        this.noticeTime = 0;
        this.load(0);

        this.ui['screen-action'].addEventListener('click', () => this.activate());
        this.ui.pause.addEventListener('click', () => this.togglePause());
        this.ui.fullscreen.hidden = !document.fullscreenEnabled;
        this.ui.fullscreen.addEventListener('click', async () => {
            this.ui.fullscreen.blur();
            try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await document.documentElement.requestFullscreen();
            } catch {
                this.notify('Vollbild ist in diesem Browser gerade nicht verfügbar.');
            }
        });
        document.addEventListener('fullscreenchange', () => {
            this.ui.fullscreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
        });
        window.addEventListener('keydown', event => {
            if (event.repeat) return;
            if (event.code === 'Escape' && !document.fullscreenElement) this.togglePause();
            if (event.code === 'Enter' && this.state !== 'playing' && !(event.target instanceof HTMLButtonElement)) {
                event.preventDefault();
                this.activate();
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'playing') this.togglePause();
        });
        this.lastFrame = performance.now();
        this.accumulator = 0;
        requestAnimationFrame(now => this.frame(now));
    }

    load(index) {
        this.index = index;
        this.level = this.levels[index];
        this.player = new Player();
        this.foes = this.level.enemies.map((data, i) => new Foe(data, i));
        this.scrolls = this.level.scrolls.map(scroll => ({ ...scroll, taken: false }));
        this.shots = [];
        this.particles = [];
        this.remaining = this.foes.length;
        this.gate = this.level.width - 65;
        this.hasDash = this.level.number >= 4;
        this.hasDoubleJump = this.level.number >= 8;
        this.input.clear();
        this.view.camera = 0;
        this.entryScore = this.score;
        this.noticeTime = 0;
        this.ui.notice.hidden = true;
        this.ui.game.style.setProperty('--accent', this.level.accent);
        this.ui['level-number'].textContent = 'LEVEL ' + String(this.level.number).padStart(2, '0') + ' / ' + this.levels.length;
        this.ui['level-name'].textContent = this.level.name;
        this.ui.dash.hidden = !this.hasDash;
        this.ui['dash-status'].hidden = !this.hasDash;
        this.ui['jump-status'].hidden = !this.hasDoubleJump;
        this.refreshHud();
    }

    activate() {
        if (this.state === 'playing') return;
        const previous = this.state;
        if (previous === 'over') {
            this.score = this.entryScore;
            this.load(this.index);
        } else if (previous === 'won') {
            this.score = 0;
            this.load(0);
        }
        this.play();
        if (previous === 'ready' || previous === 'won') this.notify('Besiege alle Gegner und erreiche das Tor rechts.');
    }

    play() {
        this.state = 'playing';
        this.input.clear();
        this.accumulator = 0;
        this.ui.overlay.hidden = true;
        this.ui.pause.disabled = false;
        document.activeElement?.blur();
    }

    togglePause() {
        if (this.state === 'paused') this.play();
        else if (this.state === 'playing') this.show('paused', 'PAUSE', 'Spiel pausiert', 'Dein Fortschritt in diesem Level wartet auf dich.', 'Weiterspielen');
    }

    show(state, tag, title, body, action) {
        this.state = state;
        this.input.clear();
        this.ui['screen-tag'].textContent = tag;
        this.ui['screen-title'].textContent = title;
        this.ui['screen-text'].textContent = body;
        this.ui['screen-action'].textContent = action;
        this.ui.overlay.hidden = false;
        this.ui.pause.disabled = true;
        this.ui['screen-action'].focus({ preventScroll: true });
    }

    notify(message, duration = 4) {
        this.ui.notice.textContent = message;
        this.ui.notice.hidden = false;
        this.noticeTime = duration;
    }

    burst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 35 + Math.random() * 130;
            const life = .24 + Math.random() * .22;
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life, maxLife: life });
        }
    }

    update(dt) {
        const p = this.player;
        const wasClosed = this.remaining > 0;
        this.time += dt;
        p.update(dt, this);
        for (const foe of this.foes) foe.update(dt, this);
        this.shots = this.shots.filter(shot => {
            shot.x += shot.vx * dt;
            if (Math.abs(p.x - shot.x) < 19 && shot.y > p.y - 48 && shot.y < p.y + 2) {
                p.hurt(shot.damage, this);
                return false;
            }
            return shot.x > 0 && shot.x < this.level.width;
        });

        for (const scroll of this.scrolls) {
            if (!scroll.taken && Math.abs(p.x - scroll.x) < 26 && scroll.y > p.y - 58 && scroll.y < p.y + 7) {
                scroll.taken = true;
                this.score += 50;
                p.hp = Math.min(MAX_HEALTH, p.hp + 16);
                this.burst(scroll.x, scroll.y, '#ffd289', 9);
            }
        }
        for (const part of this.particles) {
            part.x += part.vx * dt;
            part.y += part.vy * dt;
            part.vy += 220 * dt;
            part.life -= dt;
        }
        this.particles = this.particles.filter(part => part.life > 0);
        if (this.noticeTime > 0) {
            this.noticeTime -= dt;
            if (this.noticeTime <= 0) this.ui.notice.hidden = true;
        }
        if (!p.hp) {
            this.show('over', 'LEVEL ' + this.level.number, 'Game Over', 'Du startest dieses Level noch einmal.', 'Level wiederholen');
            return;
        }
        if (wasClosed && !this.remaining) this.notify('Tor offen! Laufe bis zum rechten Ende.');
        if (p.x >= this.gate && p.y >= GROUND - 72) {
            if (!this.remaining) this.advance();
            else if (!this.noticeTime || this.ui.notice.hidden) this.notify('Das Tor öffnet sich, sobald alle Gegner besiegt sind.', 2);
        }
    }

    advance() {
        this.score += 150;
        if (this.index === this.levels.length - 1) {
            this.show('won', '10 / 10 LEVEL', 'Schattenpfad geschafft!', 'Du hast den Endboss besiegt und ' + this.score + ' Punkte erreicht.', 'Neu spielen');
            return;
        }
        this.load(this.index + 1);
        switch (this.level.number) {
            case 4:
                this.notify('Neue Fähigkeit: Dash · Umschalttaste oder ➜', 5);
                break;
            case 8:
                this.notify('Neue Fähigkeit: Doppelsprung · In der Luft erneut springen', 5);
                break;
            default:
                this.notify('Level ' + this.level.number + ' · ' + this.level.name);
        }
    }

    refreshHud() {
        const p = this.player;
        const write = (id, value) => {
            if (this.ui[id].textContent !== value) this.ui[id].textContent = value;
        };
        write('health-label', p.hp + ' HP');
        const meter = this.ui['health-bar'].parentElement;
        if (meter.getAttribute('aria-valuenow') !== String(p.hp)) meter.setAttribute('aria-valuenow', p.hp);
        write('score', this.score + ' PUNKTE');
        write('remaining', this.remaining === 0 ? 'Tor offen' : this.remaining === 1 ? '1 Gegner übrig' : this.remaining + ' Gegner übrig');
        this.ui['health-bar'].style.transform = 'scaleX(' + p.hp / MAX_HEALTH + ')';
        this.ui.progress.style.transform = 'scaleX(' + clamp((p.x - 80) / (this.gate - 80), 0, 1) + ')';
        this.ui.special.classList.toggle('cooling', p.specialWait > 0);
        this.ui['special-status'].classList.toggle('cooling', p.specialWait > 0);
        this.ui.dash.classList.toggle('cooling', p.dashWait > 0);
        this.ui['dash-status'].classList.toggle('cooling', p.dashWait > 0);
    }

    frame(now) {
        const elapsed = Math.min(.05, (now - this.lastFrame) / 1000);
        this.lastFrame = now;
        if (this.state === 'playing') {
            this.accumulator += elapsed;
            while (this.accumulator >= STEP && this.state === 'playing') {
                this.update(STEP);
                this.accumulator -= STEP;
            }
        }
        this.refreshHud();
        this.view.draw(this, elapsed, this.state === 'playing' ? this.accumulator / STEP : 1);
        requestAnimationFrame(time => this.frame(time));
    }
}

const levels = JSON.parse(document.getElementById('level-data').textContent);
new Game(levels);
