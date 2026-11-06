export const GROUND = 398;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const noise = value => {
    const wave = Math.sin(value * 92.481 + 41.7) * 13846.37;
    return wave - Math.floor(wave);
};

export class GameView {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = 0;
        this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.resize();
        new ResizeObserver(() => this.resize()).observe(canvas);
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const { width, height } = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, width);
        this.height = Math.max(1, height);
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.scale = clamp(Math.min(this.height / 485, this.width / 635), .49, 2.2);
        this.floor = this.height * (this.width < this.height ? .76 : .79);
    }

    draw(game, dt, alpha) {
        const c = this.ctx;
        const p = game.player;
        const px = mix(p.lastX, p.x, alpha);
        const py = mix(p.lastY, p.y, alpha);
        const visible = this.width / this.scale;
        const end = Math.max(0, game.level.width - visible);
        const target = clamp(px - visible * .36, 0, end);
        this.camera = clamp(mix(this.camera, target, 1 - Math.exp(-9 * dt)), 0, end);

        c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.landscape(game.level, this.reduceMotion ? 0 : game.time);
        c.save();
        c.translate(-this.camera * this.scale, this.floor - GROUND * this.scale);
        c.scale(this.scale, this.scale);
        this.terrain(game);
        this.drawGate(game.gate, game.remaining === 0, game.level.accent);
        for (const scroll of game.scrolls) {
            if (!scroll.taken && this.visible(scroll.x)) this.drawScroll(scroll, game.time);
        }
        for (const foe of game.foes) {
            if (foe.hp && this.visible(foe.x)) this.drawFoe(foe, alpha, game.time);
        }
        for (const shot of game.shots) {
            if (this.visible(shot.x)) this.drawShot(shot, game.time);
        }
        this.drawPlayer(p, px, py, game.time);
        for (const part of game.particles) {
            c.globalAlpha = part.life / part.maxLife;
            c.fillStyle = part.color;
            c.fillRect(part.x, part.y, 3, 3);
        }
        c.restore();
    }

    visible(x, extra = 110) {
        return x >= this.camera - extra && x <= this.camera + this.width / this.scale + extra;
    }

    landscape(level, time) {
        const c = this.ctx;
        const { width, height, floor } = this;
        const sky = c.createLinearGradient(0, 0, 0, floor);
        sky.addColorStop(0, level.sky[0]);
        sky.addColorStop(.82, level.sky[1]);
        sky.addColorStop(1, level.sky[0]);
        c.fillStyle = sky;
        c.fillRect(0, 0, width, height);

        c.fillStyle = '#fff5d9';
        for (let i = 0; i < 58; i++) {
            const x = (noise(i + 100) * (width + 80) - this.camera * .045) % (width + 80);
            const y = 23 + noise(i + 300) * floor * .47;
            c.globalAlpha = .17 + noise(i + 70) * .5;
            c.fillRect(x < 0 ? x + width + 80 : x, y, i % 9 ? 1 : 2, i % 9 ? 1 : 2);
        }
        c.globalAlpha = 1;

        const moonX = width * .72 - Math.min(width * .2, this.camera * .04);
        const moonY = height * .24;
        const radius = clamp(height * .065, 22, 65);
        const halo = c.createRadialGradient(moonX, moonY, radius * .25, moonX, moonY, radius * 2.8);
        halo.addColorStop(0, '#ffe4af75');
        halo.addColorStop(1, '#ffe4af00');
        c.fillStyle = halo;
        c.fillRect(moonX - radius * 3, moonY - radius * 3, radius * 6, radius * 6);
        c.fillStyle = '#ffe7c4';
        c.beginPath();
        c.arc(moonX, moonY, radius, 0, Math.PI * 2);
        c.fill();

        this.ridge('#202239ad', .12, floor * .77, floor * .34, 132, level.number);
        this.ridge('#171d30d9', .24, floor * .92, floor * .32, 98, level.number + 45);
        this.ridge('#111a2bed', .43, floor * 1.03, floor * .27, 74, level.number + 90);

        c.strokeStyle = '#0b1320a0';
        const shift = this.camera * .6;
        const first = Math.floor(shift / 140);
        for (let i = first; i < first + width / 140 + 2; i++) {
            const x = i * 140 + noise(i + level.number) * 57 - shift;
            const top = floor * (.55 + noise(i + 90) * .19);
            const sway = Math.sin(time * 1.2 + i) * 4;
            c.lineWidth = 3 + noise(i + 333) * 5;
            c.beginPath();
            c.moveTo(x, floor);
            c.quadraticCurveTo(x + 2, top + 30, x + 14 + sway, top);
            c.moveTo(x + 4, top + 41);
            c.lineTo(x - 18, top + 25);
            c.moveTo(x + 7, top + 25);
            c.lineTo(x + 31 + sway, top + 13);
            c.stroke();
        }
        const mist = c.createLinearGradient(0, floor * .51, 0, floor);
        mist.addColorStop(0, level.accent + '00');
        mist.addColorStop(.66, level.accent + '13');
        mist.addColorStop(1, level.accent + '00');
        c.fillStyle = mist;
        c.fillRect(0, floor * .51, width, floor * .49);
    }

    ridge(color, parallax, baseline, height, spacing, seed) {
        const c = this.ctx;
        const shift = this.camera * parallax;
        const first = Math.floor(shift / spacing);
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(-spacing, this.floor + 3);
        for (let i = first - 1; i <= first + this.width / spacing + 2; i++) {
            const x = i * spacing - shift;
            const y = baseline - height * (.2 + noise(i + seed) * .77);
            c.lineTo(x, y);
            c.lineTo(x + spacing * .42, y + height * .42);
        }
        c.lineTo(this.width + spacing, this.floor + 3);
        c.closePath();
        c.fill();
    }

    terrain(game) {
        const c = this.ctx;
        const left = Math.floor(this.camera);
        const right = left + this.width / this.scale + 2;
        const bottom = GROUND + (this.height - this.floor) / this.scale + 3;
        const earth = c.createLinearGradient(0, GROUND, 0, bottom);
        earth.addColorStop(0, '#252b3d');
        earth.addColorStop(1, '#101422');
        c.fillStyle = earth;
        c.fillRect(left - 2, GROUND, right - left + 4, bottom - GROUND);
        c.fillStyle = game.level.accent;
        c.globalAlpha = .48;
        c.fillRect(left - 2, GROUND, right - left + 4, 2);
        c.globalAlpha = 1;

        for (let i = Math.floor(left / 35); i <= right / 35; i++) {
            const x = i * 35 + noise(i + 81) * 20;
            c.fillStyle = i % 4 ? '#6c71843b' : '#b3a9a54e';
            c.fillRect(x, GROUND + 8 + noise(i) * 31, 5 + noise(i + 9) * 12, 2);
            if (i % 3 === 0) {
                c.strokeStyle = '#a2a69c63';
                c.beginPath();
                c.moveTo(x, GROUND + 1);
                c.lineTo(x - 3, GROUND - 6);
                c.moveTo(x, GROUND + 1);
                c.lineTo(x + 5, GROUND - 9);
                c.stroke();
            }
        }
        for (const p of game.level.platforms) {
            if (!this.visible(p.x + p.width / 2, p.width)) continue;
            c.fillStyle = '#27263a';
            c.fillRect(p.x, p.y, p.width, 12);
            c.fillStyle = '#786b75';
            c.fillRect(p.x + 2, p.y + 4, p.width - 4, 2);
            c.fillStyle = game.level.accent;
            c.fillRect(p.x, p.y, p.width, 2);
            c.fillStyle = '#23213180';
            c.fillRect(p.x + 5, p.y + 12, p.width - 10, 5);
        }
    }

    drawGate(x, open, accent) {
        if (!this.visible(x)) return;
        const c = this.ctx;
        const top = GROUND - 91;
        const shine = c.createLinearGradient(x - 26, 0, x + 26, 0);
        shine.addColorStop(0, '#0a1125');
        shine.addColorStop(.5, open ? accent + 'b0' : '#20243b');
        shine.addColorStop(1, '#0a1125');
        c.fillStyle = shine;
        c.fillRect(x - 26, top + 14, 52, 77);
        c.strokeStyle = open ? accent : '#6f5568';
        c.lineWidth = 2;
        c.strokeRect(x - 26, top + 14, 52, 77);
        c.fillStyle = '#403147';
        c.fillRect(x - 38, top + 6, 76, 8);
        c.fillRect(x - 34, top + 13, 8, 78);
        c.fillRect(x + 26, top + 13, 8, 78);
        c.fillStyle = open ? accent : '#d6969c';
        c.fillRect(x - 43, top + 1, 86, 5);
        c.fillStyle = '#fff2db';
        c.font = 'bold 11px system-ui';
        c.textAlign = 'center';
        c.fillText(open ? 'TOR OFFEN' : 'TOR', x, top - 9);
        c.textAlign = 'start';
    }

    drawScroll(scroll, time) {
        const c = this.ctx;
        const bob = this.reduceMotion ? 0 : Math.sin(time * 4 + scroll.x / 67) * 3;
        c.save();
        c.translate(scroll.x, scroll.y + bob);
        c.rotate(-.2);
        c.fillStyle = '#ffc77b36';
        c.beginPath();
        c.arc(0, 0, 16, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffe4a9';
        c.fillRect(-5, -9, 10, 18);
        c.fillStyle = '#ba6760';
        c.fillRect(-7, -10, 14, 3);
        c.fillRect(-7, 7, 14, 3);
        c.restore();
    }

    drawShot(shot, time) {
        const c = this.ctx;
        c.save();
        c.translate(shot.x, shot.y);
        c.rotate(time * 12);
        c.fillStyle = '#ffd09b';
        c.fillRect(-7, -1.5, 14, 3);
        c.fillRect(-1.5, -7, 3, 14);
        c.restore();
    }

    drawPlayer(p, x, y, time) {
        const c = this.ctx;
        if (p.dashTime && !this.reduceMotion) {
            for (let i = 1; i <= 4; i++) {
                c.globalAlpha = .2 - i * .035;
                this.fighter(x - p.face * i * 14, y + i, p.face, 46, '#ff986e', p.stride, !p.onGround, time);
            }
        }
        c.globalAlpha = p.hurtTime && Math.floor(p.hurtTime * 19) % 2 ? .56 : 1;
        this.fighter(x, y, p.face, 46, '#fb677c', p.stride, !p.onGround, time);
        c.globalAlpha = 1;
        if (p.attackTime) {
            const special = p.attackKind === 'special';
            const duration = special ? .35 : .18;
            const elapsed = 1 - p.attackTime / duration;
            c.save();
            c.translate(x + p.face * 10, y - 27);
            c.scale(p.face, 1);
            c.scale(special ? 2.55 : 1.18, special ? 1.3 : .83);
            c.globalAlpha = Math.min(1, p.attackTime * 11);
            c.strokeStyle = special ? '#ffbc6d' : '#e3f7ff';
            c.lineWidth = special ? 4 : 3;
            c.beginPath();
            c.arc(2, 0, (special ? 37 : 34) + elapsed * 12, -1.25 + elapsed * .65, .48 + elapsed * .83);
            c.stroke();
            c.restore();
        }
    }

    drawFoe(foe, alpha, time) {
        const c = this.ctx;
        const x = mix(foe.lastX, foe.x, alpha);
        const y = mix(foe.lastY, foe.y, alpha);
        if (foe.attackTime) {
            c.globalAlpha = .35 + .45 * (1 - foe.attackTime / foe.windup);
            c.fillStyle = '#ffb08b';
            c.beginPath();
            c.ellipse(x, GROUND - 1, foe.type === 'boss' ? 54 : 24, 4, 0, 0, Math.PI * 2);
            c.fill();
            c.globalAlpha = 1;
        }
        this.fighter(x, y, foe.face, foe.height, foe.flash ? '#fff2d9' : foe.color, foe.walk, y < GROUND - 1, time, foe.type);
        if (foe.swingTime) {
            const sweep = 1 - foe.swingTime / .22;
            c.save();
            c.translate(x + foe.face * 9, y - foe.height * .48);
            c.scale(foe.face * foe.range / 48, foe.height / 54);
            c.strokeStyle = foe.color;
            c.globalAlpha = .85 * (1 - sweep);
            c.lineWidth = 3;
            c.beginPath();
            c.arc(0, 0, 38 + sweep * 9, -1.08 + sweep * .8, .26 + sweep * .9);
            c.stroke();
            c.restore();
        }
        const bar = foe.type === 'boss' ? 75 : 36;
        c.fillStyle = '#111321';
        c.fillRect(x - bar / 2, y - foe.height - 12, bar, 4);
        c.fillStyle = foe.attackTime ? '#ffce92' : foe.color;
        c.fillRect(x - bar / 2, y - foe.height - 12, bar * (foe.attackTime ? 1 - foe.attackTime / foe.windup : foe.hp / foe.maxHp), 4);
    }

    fighter(x, y, face, height, accent, stride, airborne, time, type = 'player') {
        const c = this.ctx;
        c.save();
        c.translate(x, y);
        c.scale(face * height / 46, height / 46);
        const step = airborne ? 3 : Math.sin(stride) * 5;
        const bob = airborne || this.reduceMotion ? 0 : Math.sin(time * 5 + x / 120) * .9;
        c.strokeStyle = '#111525';
        c.lineWidth = 6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-5, -16);
        c.lineTo(-6 + step, -8);
        c.lineTo(-9 + step, -2 - (airborne ? 4 : Math.max(0, step * .6)));
        c.moveTo(5, -16);
        c.lineTo(5 - step, -7);
        c.lineTo(8 - step, -2 - (airborne ? 6 : Math.max(0, -step * .6)));
        c.stroke();
        c.translate(0, bob);
        c.fillStyle = '#171a2e';
        c.beginPath();
        c.moveTo(-10, -31);
        c.lineTo(8, -33);
        c.lineTo(12, -13);
        c.lineTo(-12, -14);
        c.closePath();
        c.fill();
        c.fillStyle = accent;
        c.fillRect(-10, -21, 20, 3);
        c.fillRect(6, -28, 8, 4);
        c.fillStyle = '#121727';
        c.beginPath();
        c.ellipse(0, -36, 12, 10, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = accent;
        c.fillRect(-11, -40, 22, 4);
        c.fillStyle = '#fff0cc';
        c.fillRect(1, -35, 8, 2);
        c.fillStyle = accent;

        if (type === 'player') {
            const wave = this.reduceMotion ? 0 : Math.sin(time * 12 + x / 44) * 3;
            c.beginPath();
            c.moveTo(-9, -39);
            c.quadraticCurveTo(-20, -42 + wave, -30, -34 - wave);
            c.lineTo(-23, -32 - wave);
            c.quadraticCurveTo(-17, -38 + wave, -9, -36);
            c.fill();
        } else if (type === 'shield') {
            c.fillRect(7, -31, 13, 23);
            c.fillStyle = '#233344';
            c.fillRect(10, -28, 7, 17);
            c.fillStyle = accent;
            c.fillRect(12, -23, 3, 6);
        } else if (type === 'boss') {
            c.beginPath();
            c.moveTo(-10, -39);
            c.lineTo(-15, -50);
            c.lineTo(-3, -44);
            c.lineTo(5, -47);
            c.lineTo(14, -52);
            c.lineTo(10, -39);
            c.fill();
        }
        c.restore();
    }
}
