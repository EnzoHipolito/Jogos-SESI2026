// ─── SoundManager.js ────────────────────────────────────────────────────────
// Sistema de sons do BombHead usando Web Audio API (síntese procedural).
// Não necessita de arquivos externos — todos os sons são gerados em tempo real.

const SoundManager = (() => {
    let ctx = null;
    let somJaTocouResultado = false; // Evita tocar som de resultado múltiplas vezes

    // Inicializa o AudioContext na primeira interação do usuário (política do navegador)
    function inicializar() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    }

    // ─── Utilitário: criar nó de ganho (volume) ────────────────────────────
    function criarGanho(volume, tempo) {
        const ganho = ctx.createGain();
        ganho.gain.setValueAtTime(volume, tempo);
        ganho.connect(ctx.destination);
        return ganho;
    }

    // ─── Som: Tiro do Jogador (laser futurista) ────────────────────────────
    function tocarSomTiro() {
        inicializar();
        const agora = ctx.currentTime;
        const osc = ctx.createOscillator();
        const ganho = criarGanho(0.3, agora);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, agora);
        osc.frequency.exponentialRampToValueAtTime(300, agora + 0.08);

        ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.1);

        osc.connect(ganho);
        osc.start(agora);
        osc.stop(agora + 0.1);
    }

    // ─── Som: Tiro do Boss (grave e ameaçador) ────────────────────────────
    function tocarSomTiroBoss() {
        inicializar();
        const agora = ctx.currentTime;

        // Camada 1: sub-grave
        const osc1 = ctx.createOscillator();
        const ganho1 = criarGanho(0.25, agora);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(120, agora);
        osc1.frequency.exponentialRampToValueAtTime(60, agora + 0.15);
        ganho1.gain.exponentialRampToValueAtTime(0.001, agora + 0.2);
        osc1.connect(ganho1);
        osc1.start(agora);
        osc1.stop(agora + 0.2);

        // Camada 2: whoosh de ruído
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filtro = ctx.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = 400;
        filtro.Q.value = 1.5;

        const ganho2 = criarGanho(0.18, agora);
        ganho2.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);

        source.connect(filtro);
        filtro.connect(ganho2);
        source.start(agora);
    }

    // ─── Som: Impacto no Boss (tiro acertou) ──────────────────────────────
    function tocarSomImpacto() {
        inicializar();
        const agora = ctx.currentTime;

        // Punch seco
        const osc = ctx.createOscillator();
        const ganho = criarGanho(0.35, agora);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, agora);
        osc.frequency.exponentialRampToValueAtTime(50, agora + 0.08);
        ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.12);
        osc.connect(ganho);
        osc.start(agora);
        osc.stop(agora + 0.12);

        // Eco metálico
        const osc2 = ctx.createOscillator();
        const ganho2 = criarGanho(0.12, agora + 0.06);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, agora + 0.06);
        osc2.frequency.exponentialRampToValueAtTime(200, agora + 0.18);
        ganho2.gain.exponentialRampToValueAtTime(0.001, agora + 0.22);
        osc2.connect(ganho2);
        osc2.start(agora + 0.06);
        osc2.stop(agora + 0.22);
    }

    // ─── Som: Dano no Jogador (boss/tiro acertou o jogador) ───────────────
    function tocarSomDano() {
        inicializar();
        const agora = ctx.currentTime;

        // Ruído de impacto
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filtro = ctx.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = 800;

        const ganho = criarGanho(0.3, agora);
        ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.25);

        source.connect(filtro);
        filtro.connect(ganho);
        source.start(agora);

        // Nota de dor
        const osc = ctx.createOscillator();
        const ganho2 = criarGanho(0.2, agora);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, agora);
        osc.frequency.exponentialRampToValueAtTime(150, agora + 0.2);
        ganho2.gain.exponentialRampToValueAtTime(0.001, agora + 0.25);
        osc.connect(ganho2);
        osc.start(agora);
        osc.stop(agora + 0.25);
    }

    // ─── Som: Pulo ────────────────────────────────────────────────────────
    function tocarSomPulo() {
        inicializar();
        const agora = ctx.currentTime;
        const osc = ctx.createOscillator();
        const ganho = criarGanho(0.15, agora);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, agora);
        osc.frequency.exponentialRampToValueAtTime(600, agora + 0.1);

        ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.12);

        osc.connect(ganho);
        osc.start(agora);
        osc.stop(agora + 0.12);
    }

    // ─── Som: Coletável de Pontos (estrela — chime positivo) ──────────────
    function tocarSomColetavel() {
        inicializar();
        const agora = ctx.currentTime;
        const notas = [523, 659, 784, 1047]; // C5 E5 G5 C6

        notas.forEach((freq, i) => {
            const tempo = agora + i * 0.07;
            const osc = ctx.createOscillator();
            const ganho = criarGanho(0.18, tempo);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, tempo);
            ganho.gain.exponentialRampToValueAtTime(0.001, tempo + 0.12);
            osc.connect(ganho);
            osc.start(tempo);
            osc.stop(tempo + 0.12);
        });
    }

    // ─── Som: Coletável de Vida (coração — jingle de cura) ───────────────
    function tocarSomVida() {
        inicializar();
        const agora = ctx.currentTime;

        // Acorde de cura suave
        const freqs = [392, 523, 659]; // G4 C5 E5
        freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const ganho = criarGanho(0.12, agora);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, agora);
            ganho.gain.setValueAtTime(0.12, agora);
            ganho.gain.linearRampToValueAtTime(0.2, agora + 0.1);
            ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.5);
            osc.connect(ganho);
            osc.start(agora);
            osc.stop(agora + 0.5);
        });

        // Brilho agudo
        const osc2 = ctx.createOscillator();
        const ganho2 = criarGanho(0.1, agora + 0.15);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, agora + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(800, agora + 0.4);
        ganho2.gain.exponentialRampToValueAtTime(0.001, agora + 0.45);
        osc2.connect(ganho2);
        osc2.start(agora + 0.15);
        osc2.stop(agora + 0.45);
    }

    // ─── Som: Vitória (fanfarra) ──────────────────────────────────────────
    function tocarSomVitoria() {
        if (somJaTocouResultado) return;
        somJaTocouResultado = true;
        inicializar();
        const agora = ctx.currentTime;

        // Sequência de notas em espiral ascendente
        const sequencia = [
            { freq: 523, dur: 0.12, inicio: 0.0 },
            { freq: 659, dur: 0.12, inicio: 0.12 },
            { freq: 784, dur: 0.12, inicio: 0.24 },
            { freq: 1047, dur: 0.35, inicio: 0.36 },
            { freq: 1047, dur: 0.12, inicio: 0.55 },
            { freq: 1175, dur: 0.5,  inicio: 0.67 },
        ];

        sequencia.forEach(({ freq, dur, inicio }) => {
            const t = agora + inicio;
            const osc = ctx.createOscillator();
            const ganho = criarGanho(0.25, t);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t);
            ganho.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.connect(ganho);
            osc.start(t);
            osc.stop(t + dur);
        });
    }

    // ─── Som: Derrota (descendente grave) ─────────────────────────────────
    function tocarSomDerrota() {
        if (somJaTocouResultado) return;
        somJaTocouResultado = true;
        inicializar();
        const agora = ctx.currentTime;

        // Sequência descendente triste
        const sequencia = [
            { freq: 494, dur: 0.2, inicio: 0.0 },
            { freq: 440, dur: 0.2, inicio: 0.2 },
            { freq: 370, dur: 0.2, inicio: 0.4 },
            { freq: 294, dur: 0.6, inicio: 0.6 },
        ];

        sequencia.forEach(({ freq, dur, inicio }) => {
            const t = agora + inicio;
            const osc = ctx.createOscillator();
            const ganho = criarGanho(0.22, t);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);
            ganho.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.connect(ganho);
            osc.start(t);
            osc.stop(t + dur);
        });
    }

    // ─── Resetar flag de resultado (chamar ao iniciar cada fase) ──────────
    function resetarResultado() {
        somJaTocouResultado = false;
    }

    // ─── API Pública ───────────────────────────────────────────────────────
    return {
        tocarSomTiro,
        tocarSomTiroBoss,
        tocarSomImpacto,
        tocarSomDano,
        tocarSomPulo,
        tocarSomColetavel,
        tocarSomVida,
        tocarSomVitoria,
        tocarSomDerrota,
        resetarResultado,
        inicializar,
    };
})();
