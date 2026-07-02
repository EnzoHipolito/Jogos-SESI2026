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
    if (fadeDir !== 0) return; // ignora se já há um fade em curso
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

// ─── Dados globais de progresso ──────────────
const completedStages = [false, false, false, false, false];

// ─── Herói do mapa ───────────────────────────
const hero = new Hero(stages[0].x, stages[0].y);

// ─── Input global ────────────────────────────
const keys = {};

document.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Título: qualquer fade em curso bloqueia o input
    if (state === S.TITLE) {
        if (fadeDir === 0 && (e.key === 'Enter' || e.key === ' ')) {
            fadeTo(() => { state = S.MAP; });
        }
        return;
    }

    // Mapa
    if (state === S.MAP) {
        if (fadeDir === 0 && (e.key === 'Enter' || e.key === ' ') && hero.nearStage >= 0) {
            const si       = hero.nearStage;
            const unlocked = si === 0 || completedStages[si - 1];
            if (unlocked) {
                fadeTo(() => { startGame(si); state = S.PLAYING; });
            }
        }
    }

    // Jogando
    if (state === S.PLAYING) {
        handleGameKeyDown(e);
        if (e.key === 'Escape' && fadeDir === 0) {
            pauseEngine();
            fadeTo(() => { state = S.MAP; });
        }
    }

    // Resultado
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

// ─── Tela de título ──────────────────────────
let titleTick = 0;

function drawTitle() {
    mapCtx.clearRect(0, 0, W, H);
    mapCtx.drawImage(cvBg, 0, 0);

    // Overlay escuro
    mapCtx.fillStyle = 'rgba(0,0,10,0.55)';
    mapCtx.fillRect(0, 0, W, H);

    const p = Math.sin(titleTick * 0.04);

    mapCtx.textAlign    = 'center';
    mapCtx.textBaseline = 'alphabetic';

    // Logo — sombra
    mapCtx.font      = 'bold 64px Georgia';
    mapCtx.fillStyle = 'rgba(0,0,0,0.6)';
    mapCtx.fillText('SPACE RACE', W / 2 + 3, H * 0.33 + 3);

    // Logo — texto principal
    mapCtx.fillStyle = '#fffbe0';
    mapCtx.fillText('SPACE RACE', W / 2, H * 0.33);
    mapCtx.fillStyle = `rgba(255,200,50,${0.6 + 0.4 * p})`;
    mapCtx.fillText('SPACE RACE', W / 2, H * 0.33);

    // Subtítulo
    mapCtx.font      = '18px Georgia';
    mapCtx.fillStyle = 'rgba(200,230,255,0.85)';
    mapCtx.fillText('Uma aventura pelo cosmos', W / 2, H * 0.33 + 36);

    // Personagem decorativo flutuando
    mapCtx.save();
    mapCtx.translate(W / 2, H * 0.55 + p * 8);
    mapCtx.scale(2.5, 2.5);
    const tempHero = new Hero(0, 0);
    tempHero.draw(mapCtx, titleTick, false);
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
    mapCtx.fillText('WASD — andar no mapa   L/Z — atirar   ESC — voltar', W / 2, H - 14);

    titleTick++;
}

// ─── Main loop ───────────────────────────────
let tick = 0;

function loop() {
    tick++;
    uiCtx.clearRect(0, 0, W, H);

    // ── Título ──
    if (state === S.TITLE) {
        drawTitle();
        // IMPORTANTE: atualiza o fade ANTES do return para que a transição funcione
        if (fadeAlpha > 0 || fadeDir !== 0) updateFade();
        _applyFadeOverlay();
        requestAnimationFrame(loop);
        return;
    }

    // ── Mapa ──
    if (state === S.MAP) {
        hero.update(keys, W, H);
        hero.checkNearStage(stages);

        mapCtx.clearRect(0, 0, W, H);
        gameCtx.clearRect(0, 0, W, H);
        mapCtx.drawImage(cvBg, 0, 0);
        drawMapLayer(mapCtx, hero, completedStages, tick);
    }

    // ── Jogando ──
    else if (state === S.PLAYING) {
        mapCtx.clearRect(0, 0, W, H);
        updateGame(keys);
        drawGame(gameCtx, W, H);

        // Verifica vitória/derrota apenas se não há fade em curso
        if (fadeDir === 0) {
            if (isGameWon()) {
                pauseEngine();
                completedStages[activeStage] = true;
                fadeTo(() => { state = S.WIN; });
            } else if (isGameLost()) {
                pauseEngine();
                fadeTo(() => { state = S.LOSE; });
            }
        }
    }

    // ── Resultado ──
    else if (state === S.WIN || state === S.LOSE) {
        drawResult(gameCtx, mapCtx, state === S.WIN, W, H);
    }

    // Atualiza fade
    if (fadeAlpha > 0 || fadeDir !== 0) updateFade();

    _applyFadeOverlay();
    requestAnimationFrame(loop);
}

// ─── Inicialização ───────────────────────────
buildBg(bgCtx, W, H);
loop();
