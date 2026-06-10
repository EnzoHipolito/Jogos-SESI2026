// ─── Cache global de imagens ─────────────────
// getImg era chamada em des_obj mas nunca definida — adicionada aqui
const _imgCache = {};
function getImg(src) {
    if (!_imgCache[src]) {
        const img = new Image();
        img.src = src;
        _imgCache[src] = img;
    }
    return _imgCache[src];
}

// ─── Classe base: Obj ───────────────────────
class Obj {
    constructor(x, y, w, h, at) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.at = at; // src da imagem ou cor
    }

    des_obj(ctx) {
        ctx.drawImage(getImg(this.at), this.x, this.y, this.w, this.h);
    }

    colid(objeto) {
        return (
            this.x < objeto.x + objeto.w &&
            this.x + this.w > objeto.x &&
            this.y < objeto.y + objeto.h &&
            this.y + this.h > objeto.y
        );
    }
}

// ─── Nave do jogador ───────────────────────
class Nave extends Obj {
    constructor(x, y, w, h, at, vidas) {
        super(x, y, w, h, at);
        this.dir  = 0;
        this.pts  = 0;
        this.vida = vidas || 5;
    }

    mov() {
        this.x += this.dir;
        if (this.x <= 0)   this.x = 0;
        if (this.x >= 750) this.x = 750;
    }
}

// ─── Disco (inimigo) ───────────────────────
class Disco extends Obj {
    constructor(x, y, w, h, at, vel) {
        super(x, y, w, h, at);
        this.vel = vel || (Math.random() * (6 - 3) + 3);
    }

    mov() {
        this.y += this.vel;
    }
}

// ─── Tiro ──────────────────────────────────
class Tiro extends Obj {
    des_tiro(ctx) {
        ctx.fillStyle = '#00eeff';
        ctx.shadowColor = '#00eeff';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }

    mov() {
        this.y -= 10;
    }
}

// ─── Background (faixas scrolláveis) ───────
class BG extends Obj {
    mov(ini, lim) {
        this.y += 2;
        if (this.y > lim) this.y = ini;
    }
}

// ─── Texto helper ──────────────────────────
class Texto {
    des_text(ctx, texto, x, y, cor, font, align) {
        ctx.font = font || '20px Georgia';
        ctx.fillStyle = cor || 'white';
        ctx.textAlign = align || 'left';
        ctx.fillText(texto, x, y);
    }
}

// ─── Cache de imagem do herói (singleton) ───
const _heroImg = new Image();
_heroImg.src = 'assets/personagens_inicio.png';

// ─── Herói do mapa ──────────────────────────
class Hero {
    constructor(x, y) {
        this.x         = x;
        this.y         = y;
        this.speed     = 3;
        this.dir       = { x: 0, y: 0 };
        this.facing    = 1;
        this.nearStage = -1;
    }

    update(keys, W, H) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['ArrowUp'])    dy = -1;
        if (keys['s'] || keys['ArrowDown'])  dy =  1;
        if (keys['a'] || keys['ArrowLeft'])  dx = -1;
        if (keys['d'] || keys['ArrowRight']) dx =  1;

        if (dx || dy) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;
            this.dir = { x: dx, y: dy };
            if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
            this.x = Math.max(20, Math.min(W - 20, this.x + dx * this.speed));
            this.y = Math.max(20, Math.min(H - 20, this.y + dy * this.speed));
        } else {
            this.dir = { x: 0, y: 0 };
        }
    }

    checkNearStage(stages) {
        this.nearStage = -1;
        for (let i = 0; i < stages.length; i++) {
            if (Math.hypot(this.x - stages[i].x, this.y - stages[i].y) < 38) {
                this.nearStage = i;
                break;
            }
        }
    }

    draw(ctx, tick, moving) {
        const img = _heroImg;
        const bob = Math.sin(tick * 0.18) * 1.5;
        const iw  = 56;
        const ih  = 56;

        ctx.save();
        ctx.translate(this.x, this.y + bob);

        ctx.beginPath();
        ctx.ellipse(0, ih / 2 + 4, 18, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        ctx.scale(this.facing, 1);

        if (moving) {
            const tilt = Math.sin(tick * 0.25) * 4 * (Math.PI / 180);
            ctx.rotate(tilt);
        }

        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
        ctx.restore();
    }
}

// ─── Funções utilitárias gráficas ──────────
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);     ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);     ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);         ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawStar(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a  = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const ai = ((i * 4 + 2) * Math.PI / 5) - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(ai) * r * 0.4, Math.sin(ai) * r * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function rng(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}