// ─── Configuração por fase ──────────────────
const stageConfigs = [
    { discoSpd: [1.5, 2.5], rates: [90, 120, 180], lives: 5, ptsWin: 3,  bgs: ['assets/background.jpg',  'assets/background2.jpg'] },
    { discoSpd: [2.5, 4.0], rates: [70, 100, 150], lives: 5, ptsWin: 5,  bgs: ['assets/background2.jpg', 'assets/background.jpg']  },
    { discoSpd: [3.5, 5.5], rates: [55,  80, 120], lives: 4, ptsWin: 8,  bgs: ['assets/background.jpg',  'assets/background2.jpg'] },
    { discoSpd: [4.0, 6.5], rates: [45,  65,  95], lives: 3, ptsWin: 12, bgs: ['assets/background2.jpg', 'assets/background.jpg']  },
    { discoSpd: [5.0, 8.0], rates: [35,  50,  75], lives: 3, ptsWin: 20, bgs: ['assets/background.jpg',  'assets/background2.jpg'] },
];

// ─── Estado do jogo ─────────────────────────
let nav        = null;
let gbg        = [];
let grupoTiros = [];
let grupoDiscos = [];
let gtimers    = [0, 0, 0];
let cfg        = null;
let activeStage = 0;

// ─── Áudio ──────────────────────────────────
const sfxEngine = new Audio('assets/nave_som.mp3');
const sfxHit    = new Audio('assets/batida.mp3');
sfxEngine.loop   = true;
sfxEngine.volume = 0.5;
sfxHit.volume    = 0.6;

// ─── Iniciar fase ────────────────────────────
function startGame(stageIndex) {
    activeStage  = stageIndex;
    cfg          = stageConfigs[stageIndex];
    grupoTiros   = [];
    grupoDiscos  = [];
    gtimers      = [0, 0, 0];

    nav = new Nave(375, 490, 50, 70, 'assets/nave.png', cfg.lives);

    // 4 faixas de BG para scroll infinito
    gbg = [
        new BG(0,     0,    800, 560, cfg.bgs[0]),
        new BG(0,  -560,   800, 560, cfg.bgs[1]),
        new BG(0, -1120,   800, 560, cfg.bgs[0]),
        new BG(0, -1680,   800, 560, cfg.bgs[1]),
    ];

    try {
        sfxEngine.currentTime = 0;
        sfxEngine.play().catch(() => {});
    } catch (e) {}
}

// ─── Atualizar lógica ────────────────────────
function updateGame(keys) {
    // Scroll do fundo — avança 2px por frame, reseta ao sair da tela
    gbg.forEach(b => {
        b.y += 2;
        if (b.y > 560) b.y -= 560 * 4;
    });

    // Movimento da nave
    nav.mov();

    // Atualizar tiros
    grupoTiros.forEach(t => t.mov());
    grupoTiros = grupoTiros.filter(t => t.y > -20);

    // Spawn de discos
    const [s0, s1] = cfg.discoSpd;
    const rspd = () => s0 + Math.random() * (s1 - s0);
    const rx   = () => Math.random() * 740 + 5;

    gtimers[0]++;
    gtimers[1]++;
    gtimers[2]++;

    if (gtimers[0] >= cfg.rates[0]) {
        gtimers[0] = 0;
        grupoDiscos.push(new Disco(rx(), -60, 50, 50, 'assets/disco.png',  rspd()));
    }
    if (gtimers[1] >= cfg.rates[1]) {
        gtimers[1] = 0;
        grupoDiscos.push(new Disco(rx(), -60, 50, 50, 'assets/disco2.png', rspd()));
    }
    if (gtimers[2] >= cfg.rates[2]) {
        gtimers[2] = 0;
        grupoDiscos.push(new Disco(rx(), -60, 50, 50, 'assets/disco3.png', rspd()));
    }

    grupoDiscos.forEach(d => d.mov());
    grupoDiscos = grupoDiscos.filter(d => d.y < 580);

    // Colisão tiro → disco
    grupoTiros = grupoTiros.filter(tiro => {
        let acertou = false;
        grupoDiscos = grupoDiscos.filter(disco => {
            if (tiro.colid(disco)) { nav.pts++; acertou = true; return false; }
            return true;
        });
        return !acertou;
    });

    // Colisão nave → disco
    grupoDiscos = grupoDiscos.filter(disco => {
        if (nav.colid(disco)) {
            nav.vida--;
            try { sfxHit.currentTime = 0; sfxHit.play().catch(() => {}); } catch (e) {}
            return false;
        }
        return true;
    });
}

// ─── Renderização do jogo ────────────────────
function drawGame(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);

    // BG scroll
    gbg.forEach(b => b.des_obj(ctx));

    // Discos
    grupoDiscos.forEach(d => d.des_obj(ctx));

    // Tiros
    grupoTiros.forEach(t => t.des_tiro(ctx));

    // Nave
    nav.des_obj(ctx);

    // HUD — nome da fase
    const sn = stages[activeStage];
    ctx.font = 'bold 15px Georgia';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(`FASE ${activeStage + 1} — ${sn.name}`, W / 2 + 1, 22);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`FASE ${activeStage + 1} — ${sn.name}`, W / 2, 21);

    // Barra de progresso
    const prog = Math.min(nav.pts / cfg.ptsWin, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(12, 30, 220, 13);
    ctx.fillStyle = '#44ff88';          ctx.fillRect(12, 30, 220 * prog, 13);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
    ctx.strokeRect(12, 30, 220, 13);
    ctx.font = '10px Georgia'; ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${nav.pts} / ${cfg.ptsWin}`, 238, 41);

    // Vidas
    for (let i = 0; i < nav.vida; i++) {
        ctx.font = '17px serif'; ctx.textAlign = 'right';
        ctx.fillStyle = '#ff3355';
        ctx.fillText('♥', W - 8 - i * 20, 44);
    }

    // Controles
    ctx.font = '10px Georgia'; ctx.fillStyle = 'rgba(200,200,200,0.45)';
    ctx.textAlign = 'left';
    ctx.fillText('← → mover   L/Z atirar   ESC sair', 10, H - 10);
}

// ─── Tela de resultado ───────────────────────
let resTick = 0;

function resetResTick() { resTick = 0; }

function drawResult(ctx, mapCtx, win, W, H) {
    ctx.clearRect(0, 0, W, H);
    mapCtx.clearRect(0, 0, W, H);

    mapCtx.fillStyle = '#08001f';
    mapCtx.fillRect(0, 0, W, H);

    // Estrelas orbitantes animadas
    for (let i = 0; i < 6; i++) {
        const a   = (i / 6) * Math.PI * 2 + resTick * 0.03;
        const rad = 100 + 40 * Math.sin(resTick * 0.04 + i);
        const sx  = W / 2 + Math.cos(a) * rad;
        const sy  = H * 0.45 + Math.sin(a) * rad * 0.5;
        drawStar(
            mapCtx, sx, sy,
            10 + 4 * Math.sin(resTick * 0.07 + i),
            win
                ? `rgba(255,210,50,${0.4 + 0.4 * Math.sin(resTick * 0.1 + i)})`
                : `rgba(200,80,80,${0.3 + 0.3 * Math.sin(resTick * 0.1 + i)})`
        );
    }

    mapCtx.textAlign = 'center';

    if (win) {
        mapCtx.font = `bold ${54 + Math.sin(resTick * 0.05) * 3}px Georgia`;
        mapCtx.fillStyle = 'rgba(0,0,0,0.5)';
        mapCtx.fillText('VITÓRIA!', W / 2 + 2, H * 0.43 + 2);
        mapCtx.fillStyle = '#FFD700';
        mapCtx.fillText('VITÓRIA!', W / 2, H * 0.43);
        mapCtx.font = '20px Georgia'; mapCtx.fillStyle = '#aaffcc';
        mapCtx.fillText(`Fase ${activeStage + 1} concluída!`, W / 2, H * 0.43 + 40);
        drawStar(mapCtx, W / 2, H * 0.3, 36, '#FFD700');
    } else {
        mapCtx.font = 'bold 52px Georgia';
        mapCtx.fillStyle = 'rgba(0,0,0,0.5)';
        mapCtx.fillText('DERROTA!', W / 2 + 2, H * 0.43 + 2);
        mapCtx.fillStyle = '#ff4444';
        mapCtx.fillText('DERROTA!', W / 2, H * 0.43);
        mapCtx.font = '18px Georgia'; mapCtx.fillStyle = 'rgba(220,200,200,0.8)';
        mapCtx.fillText('Tente novamente!', W / 2, H * 0.43 + 38);
    }

    mapCtx.font = '15px Georgia';
    mapCtx.globalAlpha = 0.5 + 0.5 * Math.sin(resTick * 0.08);
    mapCtx.fillStyle = '#fff';
    mapCtx.fillText('ENTER — continuar', W / 2, H * 0.68);
    if (!win) {
        mapCtx.fillText('R — tentar de novo', W / 2, H * 0.68 + 24);
    }
    mapCtx.globalAlpha = 1;

    resTick++;
}

// ─── Input do jogo (nave) ────────────────────
function handleGameKeyDown(e) {
    if (e.key === 'a' || e.key === 'ArrowLeft')  nav.dir = -5;
    if (e.key === 'd' || e.key === 'ArrowRight') nav.dir =  5;
    if (e.key === 'l' || e.key === 'z' || e.key === ' ') {
        grupoTiros.push(new Tiro(nav.x - 4 + nav.w / 2, nav.y, 8, 18, 'cyan'));
    }
}

function handleGameKeyUp(e) {
    if (e.key === 'a' || e.key === 'ArrowLeft')  nav.dir = 0;
    if (e.key === 'd' || e.key === 'ArrowRight') nav.dir = 0;
}

function isGameWon()  { return nav && nav.pts >= cfg.ptsWin; }
function isGameLost() { return nav && nav.vida <= 0; }
function pauseEngine(){ sfxEngine.pause(); }
