// ─── Canvas & contextos ──────────────────────
const W = 800, H = 560;
const cvBg    = document.getElementById('cBg');
const cvMap   = document.getElementById('cMap');
const cvGame  = document.getElementById('cGame');
const cvUI    = document.getElementById('cUI');
const bgCtx   = cvBg.getContext('2d');
const mapCtx  = cvMap.getContext('2d');
const gameCtx = cvGame.getContext('2d');
const uiCtx   = cvUI.getContext('2d');

// ─── Estados do jogo ─────────────────────────
const S = { TITLE: 'TITLE', MAP: 'MAP', PLAYING: 'PLAYING', WIN: 'WIN', LOSE: 'LOSE' };
let state = S.TITLE;

// ─── Fade transition ─────────────────────────
let fadeAlpha = 0, fadeDir = 0, fadeCb = null;

function fadeTo(cb) {
    if (fadeDir !== 0) return;
    fadeDir   = 1;
    fadeAlpha = 0;
    fadeCb    = cb;
}

function updateFade() {
    if (fadeDir === 1) {
        fadeAlpha = Math.min(fadeAlpha + 0.05, 1);
        if (fadeAlpha >= 1) {
            fadeDir = -1;
            if (fadeCb) { fadeCb(); fadeCb = null; }
        }
    } else if (fadeDir === -1) {
        fadeAlpha = Math.max(fadeAlpha - 0.05, 0);
        if (fadeAlpha <= 0) fadeDir = 0;
    }
}

function _applyFadeOverlay() {
    if (fadeAlpha > 0) {
        uiCtx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        uiCtx.fillRect(0, 0, W, H);
    }
}

// ─── Dados globais de progresso (3 fases) ───
const completedStages = [false, false, false];

let hero = new Hero(
    stages[0].x,
    stages[0].y - 45
);

// ─── Verificação periódica de estado de fase ─
function checkGameState() {
    if (state !== S.PLAYING || fadeDir !== 0) return;

    if (isGameWon()) {
        pauseEngine();
        completedStages[activeStage] = true;
        fadeTo(() => { state = S.WIN; });
    } else if (isGameLost()) {
        pauseEngine();
        fadeTo(() => { state = S.LOSE; });
    }
}

// ─── Entrar em uma fase ──────────────────────
function enterStage(si) {
    if (fadeDir !== 0) return;
    const unlocked = si === 0 || completedStages[si - 1];
    if (!unlocked) return;
    fadeTo(() => { startGame(si); state = S.PLAYING; });
}

// ─── Input de teclado ────────────────────────
const keys = {};

document.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Título
    if (state === S.TITLE) {
        if (fadeDir === 0 && (e.key === 'Enter' || e.key === ' ')) {
            fadeTo(() => { state = S.MAP; });
        }
        return;
    }

    // Mapa
    if (state === S.MAP) {

        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= stages.length) {
            enterStage(num - 1);
            return;
        }
    
        if (e.key === 'Enter' && hero.nearStage >= 0) {
            enterStage(hero.nearStage);
            return;
        }
    
        if (e.key === 'Escape' && fadeDir === 0) {
            fadeTo(() => { state = S.TITLE; });
        }
        return;
    }

    // Jogando
    if (state === S.PLAYING) {
        handleGameKeyDown(e);
        if (e.key === 'Escape' && fadeDir === 0) {
            pauseEngine();
            fadeTo(() => { state = S.MAP; });
        }
        return;
    }

    // Resultado (WIN / LOSE)
    if (state === S.WIN || state === S.LOSE) {
        if (fadeDir === 0 && (e.key === 'Enter' || e.key === ' ')) {
            resetResTick();
            fadeTo(() => { state = S.MAP; });
        }
        if (fadeDir === 0 && state === S.LOSE && (e.key === 'r' || e.key === 'R')) {
            resetResTick();
            fadeTo(() => { startGame(activeStage); state = S.PLAYING; });
        }
    }
});

document.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (state === S.PLAYING) handleGameKeyUp(e);
});

// ─── Mouse no canvas do mapa ─────────────────
let _mapHoveredStage = -1;

function _canvasPoint(e) {
    const rect   = cvMap.getBoundingClientRect();
    const scaleX = cvMap.width  / rect.width;
    const scaleY = cvMap.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY,
    };
}

cvMap.addEventListener('mousemove', e => {
    if (state !== S.MAP) return;
    const { x, y } = _canvasPoint(e);
    const idx = getStageAtPoint(x, y);
    _mapHoveredStage = idx;
    setHoveredStage(idx);
    if (idx >= 0 && (idx === 0 || completedStages[idx - 1])) {
        cvMap.style.cursor = 'pointer';
    } else {
        cvMap.style.cursor = idx >= 0 ? 'not-allowed' : 'default';
    }
});

cvMap.addEventListener('mouseleave', () => {
    _mapHoveredStage = -1;
    setHoveredStage(-1);
    cvMap.style.cursor = 'default';
});

cvMap.addEventListener('click', e => {
    if (state !== S.MAP) return;
    const { x, y } = _canvasPoint(e);
    const idx = getStageAtPoint(x, y);
    if (idx >= 0) enterStage(idx);
});

// ─── Tela de título ──────────────────────────
let titleTick = 0;

function drawTitle() {
    mapCtx.clearRect(0, 0, W, H);
    mapCtx.drawImage(cvBg, 0, 0);

    mapCtx.fillStyle = 'rgba(0,0,10,0.55)';
    mapCtx.fillRect(0, 0, W, H);

    const p = Math.sin(titleTick * 0.04);

    mapCtx.textAlign    = 'center';
    mapCtx.textBaseline = 'alphabetic';

    // Logo sombra
    mapCtx.font      = 'bold 64px Georgia';
    mapCtx.fillStyle = 'rgba(0,0,0,0.6)';
    mapCtx.fillText('SPACE RACE', W / 2 + 3, H * 0.33 + 3);

    // Logo principal
    mapCtx.fillStyle = '#fffbe0';
    mapCtx.fillText('SPACE RACE', W / 2, H * 0.33);
    mapCtx.fillStyle = `rgba(255,200,50,${0.6 + 0.4 * p})`;
    mapCtx.fillText('SPACE RACE', W / 2, H * 0.33);

    // Subtítulo
    mapCtx.font      = '18px Georgia';
    mapCtx.fillStyle = 'rgba(200,230,255,0.85)';
    mapCtx.fillText('Uma aventura pelo cosmos', W / 2, H * 0.33 + 36);

    // Nave flutuando (usa nave.png — carregada via getImg)
    const naveImg = getImg('assets/nave.png');
    const naveW = 60, naveH = 84;
    const naveX = W / 2 - naveW / 2;
    const naveY = H * 0.47 + p * 8;
    mapCtx.save();
    mapCtx.shadowColor = 'rgba(0, 200, 255, 0.6)';
    mapCtx.shadowBlur  = 18;
    mapCtx.drawImage(naveImg, naveX, naveY, naveW, naveH);
    mapCtx.shadowBlur  = 0;
    mapCtx.restore();

    // Press Enter
    mapCtx.font        = 'bold 16px Georgia';
    mapCtx.globalAlpha = 0.5 + 0.5 * Math.sin(titleTick * 0.07);
    mapCtx.fillStyle   = '#FFD700';
    mapCtx.fillText('Pressione ENTER para começar', W / 2, H * 0.82);
    mapCtx.globalAlpha = 1;

    // Dica de controles
    mapCtx.font      = '11px Georgia';
    mapCtx.fillStyle = 'rgba(180,200,255,0.5)';
    mapCtx.fillText('Clique na fase ou use as teclas 1-3  |  L/Z — atirar  |  ESC — voltar', W / 2, H - 14);

    titleTick++;
}

// ─── Main loop ───────────────────────────────
let tick = 0;

function loop() {
    tick++;
    uiCtx.clearRect(0, 0, W, H);

    // Título
    if (state === S.TITLE) {
        drawTitle();
        if (fadeAlpha > 0 || fadeDir !== 0) updateFade();
        _applyFadeOverlay();
        requestAnimationFrame(loop);
        return;
    }

    // Mapa
    if (state === S.MAP) {
        mapCtx.clearRect(0, 0, W, H);
        gameCtx.clearRect(0, 0, W, H);
    
        hero.update(keys, W, H);
        hero.checkNearStage(stages);
    
        drawMapLayer(
            mapCtx,
            hero,
            completedStages,
            tick
        );
    }


    // Jogando
    else if (state === S.PLAYING) {
        mapCtx.clearRect(0, 0, W, H);
        updateGame(keys);
        drawGame(gameCtx, W, H);
        checkGameState();
    }

    // Resultado
    else if (state === S.WIN || state === S.LOSE) {
        drawResult(gameCtx, mapCtx, state === S.WIN, W, H);
    }

    if (fadeAlpha > 0 || fadeDir !== 0) updateFade();
    _applyFadeOverlay();
    requestAnimationFrame(loop);
}

// ─── Inicialização ───────────────────────────
buildBg(bgCtx, W, H);
loop();