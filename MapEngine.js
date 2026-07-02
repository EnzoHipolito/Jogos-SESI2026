// ─── Configuração das fases ─────────────────
const stages = [
    { id: 0, x: 110, y: 430, name: 'NEBULOSA',   diff: 'FÁCIL',   color: '#5dde82', pts: 3  },
    { id: 1, x: 270, y: 320, name: 'ASTEROIDES', diff: 'NORMAL',  color: '#5ab4ff', pts: 5  },
    { id: 2, x: 460, y: 390, name: 'TEMPESTADE', diff: 'DIFÍCIL', color: '#ffb347', pts: 8  },
    { id: 3, x: 590, y: 220, name: 'SATÉLITE',   diff: 'DURO',    color: '#ff6b6b', pts: 12 },
    { id: 4, x: 700, y: 110, name: 'FINAL',      diff: 'CHEFE',   color: '#d884ff', pts: 20 },
];

// Estradas entre os nós (caminhos bezier)
const roads = [
    { from: 0, to: 1, cp: [{ x: 160, y: 380 }, { x: 210, y: 300 }] },
    { from: 1, to: 2, cp: [{ x: 340, y: 310 }, { x: 400, y: 380 }] },
    { from: 2, to: 3, cp: [{ x: 510, y: 330 }, { x: 550, y: 260 }] },
    { from: 3, to: 4, cp: [{ x: 620, y: 170 }, { x: 660, y: 130 }] },
];

// ─── Background pré-renderizado ─────────────
let bgReady = false;

function buildBg(bgCtx, W, H) {
    const img = new Image();
    img.src = 'assets/background.jpg';
    img.onload = () => {
        bgCtx.drawImage(img, 0, 0, W, H);
        bgCtx.fillStyle = 'rgba(0, 0, 20, 0.45)'; // overlay pra legibilidade
        bgCtx.fillRect(0, 0, W, H);
        bgReady = true;
    };
}

// ─── Renderização do mapa (nós + herói) ─────
function drawMapLayer(ctx, hero, completedStages, tick) {
    ctx.clearRect(0, 0, 800, 560);

    for (let i = 0; i < stages.length; i++) {
        const s        = stages[i];
        const unlocked = i === 0 || completedStages[i - 1];
        const completed = completedStages[i];
        const near     = hero.nearStage === i;
        const p        = 0.5 + 0.5 * Math.sin(tick * 0.06);

        // Brilho ao aproximar
        if (near && unlocked) {
            ctx.save();
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 42 + p * 10);
            glow.addColorStop(0, `${s.color}55`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(s.x, s.y, 52, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Sombra do poste
        ctx.beginPath(); ctx.ellipse(s.x, s.y + 28, 18, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

        // Poste
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(s.x - 3, s.y, 6, 30);

        // Placa
        const bw = 70, bh = 36;
        ctx.fillStyle   = unlocked ? (near ? '#fffde0' : '#fff8d0') : '#3a3a4a';
        ctx.strokeStyle = completed ? '#60cc70' : (near ? s.color : 'rgba(0,0,0,0.4)');
        ctx.lineWidth   = near ? 2.5 : 1.5;
        roundRect(ctx, s.x - bw / 2, s.y - bh - 2, bw, bh, 6);
        ctx.fill(); ctx.stroke();

        // Número
        ctx.font = `bold 18px 'Georgia', serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = unlocked ? s.color : '#555568';
        ctx.fillText(i + 1, s.x - bw / 2 + 14, s.y - bh / 2 - 2);

        // Nome
        ctx.font = `bold 10px 'Georgia', serif`;
        ctx.fillStyle = unlocked ? '#2a1a08' : '#55556a';
        ctx.fillText(s.name, s.x + 4, s.y - bh / 2 - 2);

        // Dificuldade
        ctx.font = `9px 'Georgia', serif`;
        ctx.fillStyle = unlocked ? s.color : '#666678';
        ctx.fillText(s.diff, s.x + 4, s.y - bh / 2 + 11);

        // Cadeado
        if (!unlocked) {
            ctx.font = '16px serif'; ctx.fillStyle = '#888899';
            ctx.fillText('🔒', s.x, s.y - bh / 2 - 2);
        }

        // Estrela de completo
        if (completed) {
            drawStar(ctx, s.x + bw / 2 - 8, s.y - bh + 4, 7, '#FFD700');
        }

        // Prompt ENTER
        if (near && unlocked) {
            ctx.font = `bold 11px 'Georgia',serif`;
            const pulse = 0.6 + 0.4 * Math.sin(tick * 0.1);
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#111';
            ctx.textAlign = 'center';
            ctx.fillText('[ ENTER ]', s.x + 1, s.y - bh - 16);
            ctx.fillStyle = s.color;
            ctx.fillText('[ ENTER ]', s.x, s.y - bh - 17);
            ctx.globalAlpha = 1;
        }
    }

    // Herói
    const moving = hero.dir.x !== 0 || hero.dir.y !== 0;
    hero.draw(ctx, tick, moving);
}
