// ─── Configuração das fases (apenas 3) ─────
// Posições baseadas nos botões 1, 2 e 3 visíveis na imagem do mapa
const stages = [
    { id: 0, x: 130, y: 300, name: 'NEBULOSA',   diff: 'FÁCIL',   color: '#5dde82', pts: 3  },
    { id: 1, x: 390, y: 295, name: 'ASTEROIDES', diff: 'NORMAL',  color: '#5ab4ff', pts: 5  },
    { id: 2, x: 590, y: 295, name: 'TEMPESTADE', diff: 'DIFÍCIL', color: '#ffb347', pts: 8  },
];

// ─── Background da tela de seleção de fases ─
let bgReady = false;
const _fasesBgImg = new Image();
_fasesBgImg.src = 'assets/fundo_fases.png';
_fasesBgImg.onerror = () => {
    const alt = new Image();
    alt.src = 'assets/fundo_fases.jpg';
    alt.onload = () => { _fasesBgImg.src = alt.src; bgReady = true; };
    alt.onerror = () => { _fasesBgImg.src = 'assets/background.jpg'; };
};
_fasesBgImg.onload = () => { bgReady = true; };

// Background do cBg (usado na tela de título)
function buildBg(bgCtx, W, H) {
    const img = new Image();
    img.src = 'assets/background.jpg';
    img.onload = () => {
        bgCtx.drawImage(img, 0, 0, W, H);
        bgCtx.fillStyle = 'rgba(0, 0, 20, 0.45)';
        bgCtx.fillRect(0, 0, W, H);
    };
}

// ─── Geometria dos botões de fase ───────────
const BUTTON_RADIUS = 30;

function getStageAtPoint(px, py) {
    for (let i = 0; i < stages.length; i++) {
        const s  = stages[i];
        const dx = px - s.x;
        const dy = py - s.y;
        if (Math.sqrt(dx * dx + dy * dy) <= BUTTON_RADIUS + 10) return i;
    }
    return -1;
}

// ─── Estado de hover ────────────────────────
let hoveredStage = -1;

function setHoveredStage(idx) { hoveredStage = idx; }

// ─── Renderização do mapa ───────────────────
function drawMapLayer(ctx, _hero, completedStages, tick) {
    ctx.clearRect(0, 0, 800, 560);

    // Fundo
    if (bgReady && _fasesBgImg.complete && _fasesBgImg.naturalWidth > 0) {
        ctx.drawImage(_fasesBgImg, 0, 0, 800, 560);
    } else {
        ctx.fillStyle = '#08001f';
        ctx.fillRect(0, 0, 800, 560);
    }

    // Overlay sutil
    ctx.fillStyle = 'rgba(0, 0, 10, 0.30)';
    ctx.fillRect(0, 0, 800, 560);

    // ── Linhas de conexão entre as 3 fases ──
    ctx.save();
    for (let i = 0; i < stages.length - 1; i++) {
        const a = stages[i];
        const b = stages[i + 1];
        const unlocked = completedStages[i];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = unlocked
            ? 'rgba(255, 220, 80, 0.45)'
            : 'rgba(255,255,255,0.10)';
        ctx.lineWidth   = unlocked ? 2.5 : 1.5;
        ctx.setLineDash(unlocked ? [] : [6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.restore();

    // ── Botões de fase ──
    for (let i = 0; i < stages.length; i++) {
        const s         = stages[i];
        const unlocked  = i === 0 || completedStages[i - 1];
        const completed = completedStages[i];
        const hovered   = hoveredStage === i && unlocked;
        const pulse     = 0.5 + 0.5 * Math.sin(tick * 0.07 + i);
        const R         = BUTTON_RADIUS;

        // Glow externo animado
        if (unlocked) {
            const glowR = R + 18 + pulse * 10;
            const glow  = ctx.createRadialGradient(s.x, s.y, R * 0.5, s.x, s.y, glowR);
            glow.addColorStop(0, `${s.color}${hovered ? '55' : '30'}`);
            glow.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
        }

        // Anel externo (hover)
        if (hovered) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, R + 7, 0, Math.PI * 2);
            ctx.strokeStyle = s.color;
            ctx.lineWidth   = 2;
            ctx.globalAlpha = 0.6 + 0.4 * pulse;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Círculo principal
        const grad = ctx.createRadialGradient(s.x - R * 0.25, s.y - R * 0.25, R * 0.1, s.x, s.y, R);
        if (unlocked) {
            grad.addColorStop(0, hovered ? lighten(s.color, 60) : lighten(s.color, 30));
            grad.addColorStop(0.6, s.color);
            grad.addColorStop(1, darken(s.color, 40));
        } else {
            grad.addColorStop(0, '#3a3a52');
            grad.addColorStop(1, '#1e1e2e');
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Borda
        ctx.beginPath();
        ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
        ctx.strokeStyle = completed
            ? '#FFD700'
            : (unlocked ? (hovered ? '#fff' : s.color) : 'rgba(255,255,255,0.15)');
        ctx.lineWidth = completed ? 2.5 : (hovered ? 2.5 : 1.5);
        ctx.stroke();

        // Número da fase ou cadeado
        ctx.textAlign    = 'center';
        if (_hero) {
            _hero.draw(ctx, tick, false);
        }
        ctx.textBaseline = 'middle';

        if (unlocked) {
            ctx.font      = `bold ${hovered ? 22 : 20}px Georgia`;
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur  = 4;
            ctx.fillText(i + 1, s.x, s.y);
            ctx.shadowBlur  = 0;
        } else {
            ctx.font      = '20px serif';
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillText('🔒', s.x, s.y);
        }

        // Estrela de fase completa
        if (completed) {
            drawStar(ctx, s.x + R - 4, s.y - R + 4, 9, '#FFD700');
        }

        // Etiqueta abaixo do botão
        const labelY = s.y + R + 14;
        ctx.font      = `bold 10px Georgia`;
        ctx.fillStyle = unlocked ? '#fff' : 'rgba(255,255,255,0.3)';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur  = 6;
        ctx.fillText(s.name, s.x, labelY);

        ctx.font      = `9px Georgia`;
        ctx.fillStyle = unlocked ? s.color : 'rgba(255,255,255,0.2)';
        ctx.fillText(s.diff, s.x, labelY + 13);
        ctx.shadowBlur = 0;

        // Indicador ENTER ao hover
        if (hovered) {
            ctx.font        = `bold 10px Georgia`;
            ctx.globalAlpha = 0.55 + 0.45 * pulse;
            ctx.fillStyle   = '#fff';
            ctx.shadowColor = s.color;
            ctx.shadowBlur  = 8;
            ctx.fillText(`[ ENTER ]`, s.x, s.y - R - 14);
            ctx.shadowBlur  = 0;
            ctx.globalAlpha = 1;
        }
    }

    // Título
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font         = 'bold 20px Georgia';
    ctx.fillStyle    = 'rgba(255,255,255,0.7)';
    ctx.shadowColor  = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur   = 8;
    ctx.fillText('SELECIONE A FASE', 400, 36);
    ctx.shadowBlur   = 0;

    // Dica
    ctx.font      = '10px Georgia';
    ctx.fillStyle = 'rgba(180,200,255,0.40)';
    ctx.fillText('Clique no botão ou pressione o número da fase  |  ESC — voltar', 400, 554);
}

// ─── Helpers de cor ─────────────────────────
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}
function lighten(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${Math.min(r + amt, 255)},${Math.min(g + amt, 255)},${Math.min(b + amt, 255)})`;
}
function darken(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${Math.max(r - amt, 0)},${Math.max(g - amt, 0)},${Math.max(b - amt, 0)})`;
}