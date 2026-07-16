
const CONFIG_COLETAVEIS = {
    INTERVALO_MIN: 300,    
    INTERVALO_MAX: 480,    
    DURACAO: 480,         
    INICIO_PISCAR: 150,    
    PONTOS_ESTRELA: 50,   
    MARGEM_X_MIN: 120,     
    MARGEM_X_MAX: 580,     
    MARGEM_Y_MIN: 60,
    MARGEM_Y_MAX: 520,
    TAMANHO: 36,           
};

// Config ativa — sobrescrita por inicializarColetaveis() quando necessário
let _configAtiva = CONFIG_COLETAVEIS;

// ─── Lista global de coletáveis ativos ───────────────────────────────────────
let listaDeColetaveis = [];
let contadorSpawnColetavel = 0;
let proximoSpawnColetavel = 0;

// ─── Classe Coletavel ─────────────────────────────────────────────────────────
class Coletavel {
    constructor(tipo) {
        this.tipo = tipo; // 'pontos' ou 'vida'
        const cfg = _configAtiva;
        this.largura  = cfg.TAMANHO;
        this.altura   = cfg.TAMANHO;
        this.posicaoX = cfg.MARGEM_X_MIN +
            Math.random() * (cfg.MARGEM_X_MAX - cfg.MARGEM_X_MIN);
        this.posicaoY = cfg.MARGEM_Y_MIN +
            Math.random() * (cfg.MARGEM_Y_MAX - cfg.MARGEM_Y_MIN);
        this.tempoDe  = cfg.DURACAO; // vida restante em frames
        this.anguloFloat = Math.random() * Math.PI * 2; // fase aleatória para flutuação
    }

    /** Retorna true se o coletável deve sumir */
    estaVencido() {
        return this.tempoDe <= 0;
    }

    /** Retorna true se está piscando (últimos frames de vida) */
    estaPiscando() {
        return this.tempoDe <= CONFIG_COLETAVEIS.INICIO_PISCAR;
    }

    /** Verifica colisão simples com a nave */
    colidiuComNave(nave) {
        return (
            nave.posicaoX < this.posicaoX + this.largura &&
            nave.posicaoX + nave.largura > this.posicaoX &&
            nave.posicaoY < this.posicaoY + this.altura &&
            nave.posicaoY + nave.altura > this.posicaoY
        );
    }

    /** Desenha o coletável no canvas (estrela ou coração) */
    desenhar(ctx) {
        // Piscar nos últimos frames
        if (this.estaPiscando()) {
            const framesPiscando = Math.floor(this.tempoDe / 8);
            if (framesPiscando % 2 === 0) return; // pula frame alternado
        }

        // Flutuação suave (sobe e desce)
        this.anguloFloat += 0.05;
        const offsetY = Math.sin(this.anguloFloat) * 5;
        const cx = this.posicaoX + this.largura / 2;
        const cy = this.posicaoY + this.altura / 2 + offsetY;

        ctx.save();
        ctx.shadowBlur = 14;

        if (this.tipo === 'pontos') {
            // ─── Estrela dourada ───────────────────────────────────────────
            ctx.shadowColor = '#FFD700';
            ctx.fillStyle   = '#FFD700';
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth   = 1.5;
            desenharEstrela(ctx, cx, cy, 5, this.largura / 2, this.largura / 4.5);

            // Texto "+50"
            ctx.shadowBlur = 0;
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('+' + CONFIG_COLETAVEIS.PONTOS_ESTRELA, cx, cy + this.altura / 2 + 13);

        } else {
            // ─── Coração vermelho ──────────────────────────────────────────
            ctx.shadowColor = '#FF4466';
            ctx.fillStyle   = '#FF4466';
            ctx.strokeStyle = '#CC0033';
            ctx.lineWidth   = 1.5;
            desenharCoracao(ctx, cx, cy, this.largura / 2);

            // Texto "+1 ❤"
            ctx.shadowBlur = 0;
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('+1 vida', cx, cy + this.altura / 2 + 13);
        }

        ctx.restore();
    }
}

// ─── Utilitário: desenhar estrela ─────────────────────────────────────────────
function desenharEstrela(ctx, cx, cy, pontas, raioExterno, raioInterno) {
    ctx.beginPath();
    for (let i = 0; i < pontas * 2; i++) {
        const raio = i % 2 === 0 ? raioExterno : raioInterno;
        const angulo = (i * Math.PI) / pontas - Math.PI / 2;
        const x = cx + Math.cos(angulo) * raio;
        const y = cy + Math.sin(angulo) * raio;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// ─── Utilitário: desenhar coração ─────────────────────────────────────────────
function desenharCoracao(ctx, cx, cy, tamanho) {
    const s = tamanho * 0.85;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.3);
    ctx.bezierCurveTo(cx,         cy - s * 0.1, cx - s * 1.1, cy - s * 0.1, cx - s * 0.55, cy - s * 0.5);
    ctx.bezierCurveTo(cx - s * 1.1, cy - s * 1.1, cx - s * 1.1, cy + s * 0.3, cx,           cy + s * 0.9);
    ctx.bezierCurveTo(cx + s * 1.1, cy + s * 0.3, cx + s * 1.1, cy - s * 1.1, cx + s * 0.55, cy - s * 0.5);
    ctx.bezierCurveTo(cx + s * 1.1, cy - s * 0.1, cx,           cy - s * 0.1, cx,           cy + s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// ─── Inicializar o sistema de coletáveis (chamar em iniciarFase) ──────────────
/**
 * @param {object} [configDaFase] - Overrides opcionais de config para a fase atual.
 *   Propriedades aceitas: MARGEM_X_MIN, MARGEM_X_MAX, MARGEM_Y_MIN, MARGEM_Y_MAX,
 *   INTERVALO_MIN, INTERVALO_MAX, DURACAO, TAMANHO, PONTOS_ESTRELA
 */
function inicializarColetaveis(configDaFase) {
    // Mescla config padrão com os overrides da fase
    _configAtiva = configDaFase ? { ...CONFIG_COLETAVEIS, ...configDaFase } : CONFIG_COLETAVEIS;
    listaDeColetaveis = [];
    contadorSpawnColetavel = 0;
    proximoSpawnColetavel = Math.floor(
        _configAtiva.INTERVALO_MIN +
        Math.random() * (_configAtiva.INTERVALO_MAX - _configAtiva.INTERVALO_MIN)
    );
}

// ─── Sortear tipo de coletável (70% pontos, 30% vida) ────────────────────────
function sortearTipo() {
    return Math.random() < 0.7 ? 'pontos' : 'vida';
}

// ─── Atualizar (chamar no game loop — atualizarCalculosDoNivel) ───────────────
/**
 * @param {object} nave - objeto da nave do jogador (com posicaoX/Y, largura, altura, vida, pontos)
 * @param {number} vidaMaxima - vida máxima do jogador para limitar cura
 */
function atualizarColetaveis(nave, vidaMaxima) {
    // Spawn temporizado
    contadorSpawnColetavel++;
    if (contadorSpawnColetavel >= proximoSpawnColetavel) {
        contadorSpawnColetavel = 0;
        proximoSpawnColetavel = Math.floor(
            _configAtiva.INTERVALO_MIN +
            Math.random() * (_configAtiva.INTERVALO_MAX - _configAtiva.INTERVALO_MIN)
        );
        listaDeColetaveis.push(new Coletavel(sortearTipo()));
    }

    // Atualizar coletáveis existentes
    for (let i = listaDeColetaveis.length - 1; i >= 0; i--) {
        const col = listaDeColetaveis[i];
        col.tempoDe--;

        // Colisão com a nave
        if (col.colidiuComNave(nave)) {
            if (col.tipo === 'pontos') {
                nave.pontos = (nave.pontos || 0) + CONFIG_COLETAVEIS.PONTOS_ESTRELA;
                SoundManager.tocarSomColetavel();
            } else {
                if (nave.vida < vidaMaxima) {
                    nave.vida++;
                }
                SoundManager.tocarSomVida();
            }
            listaDeColetaveis.splice(i, 1);
            continue;
        }

        // Remover se venceu o tempo
        if (col.estaVencido()) {
            listaDeColetaveis.splice(i, 1);
        }
    }
}

// ─── Desenhar (chamar em desenharGraficosDoNivel) ─────────────────────────────
function desenharColetaveis(ctx) {
    listaDeColetaveis.forEach(col => col.desenhar(ctx));
}
