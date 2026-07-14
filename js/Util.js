// ─── Cache global de imagens ─────────────────
const _cacheDeImagens = {};
function pegarImagem(caminhoDaImagem) {
    if (!_cacheDeImagens[caminhoDaImagem]) {
        const imagem = new Image();
        imagem.src = caminhoDaImagem;
        _cacheDeImagens[caminhoDaImagem] = imagem;
    }
    return _cacheDeImagens[caminhoDaImagem];
}

// ─── Classe base: Objeto do Jogo ──────────────
class ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc) {
        this.posicaoX = posicaoX;
        this.posicaoY = posicaoY;
        this.largura = largura;
        this.altura = altura;
        this.imagemSrc = imagemSrc;
    }

    desenharObjeto() {
        contexto.drawImage(pegarImagem(this.imagemSrc), this.posicaoX, this.posicaoY, this.largura, this.altura);
    }

    colidiuCom(outroObjeto) {
        if ((this.posicaoX < outroObjeto.posicaoX + outroObjeto.largura) &&
            (this.posicaoX + this.largura > outroObjeto.posicaoX) &&
            (this.posicaoY < outroObjeto.posicaoY + outroObjeto.altura) &&
            (this.posicaoY + this.altura > outroObjeto.posicaoY)) {
            return true;
        } else {
            return false;
        }
    }
}

// ─── Herói do Mapa ─────────────────────────
class HeroiMapa extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc) {
        super(posicaoX, posicaoY, largura, altura, imagemSrc);
        this.direcaoX = 0;
        this.direcaoY = 0;
        this.velocidade = 4;
    }

    mover() {
        this.posicaoX += this.direcaoX;
        this.posicaoY += this.direcaoY;
        
        // Limites da tela
        if (this.posicaoX < 10) this.posicaoX = 10;
        if (this.posicaoX > 1024 - this.largura - 10) this.posicaoX = 800 - this.largura - 10;
        if (this.posicaoY < 10) this.posicaoY = 10;
        if (this.posicaoY > 640 - this.altura - 10) this.posicaoY = 640 - this.altura - 10;
    }
}

// ─── Nave do jogador ───────────────────────
class Nave extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc) {
        super(posicaoX, posicaoY, largura, altura, imagemSrc);
        this.direcaoDeMovimento = 0;
        this.direcaoDeMovimentoX = 0;
        this.pontos = 0;
        this.vida = 5;
    }

    mover() {
        this.posicaoY += this.direcaoDeMovimento;
        this.posicaoX += this.direcaoDeMovimentoX;
        if (this.posicaoY <= 0)   this.posicaoY = 0;
        if (this.posicaoY >= 640 - this.altura) this.posicaoY = 560 - this.altura;
    }
}

// ─── Personagem com física de plataforma ───
/**
 * Personagem controlável com gravidade, pulo e movimento horizontal.
 * Usa a borda inferior do canvas como chão.
 */
class Personagem extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc) {
        super(posicaoX, posicaoY, largura, altura, imagemSrc);
        this.pontos = 0;
        this.vida = 5;
        this.velocidadeX = 0;        
        this.velocidadeY = 0;        
        this.gravidade = 0.5;        
        this.forcaDoPulo = -12;      
        this.velocidadeMovimento = 4; 
        this.noChao = false;         
        this.temChao = true;
    }

    /**
     * Aplica gravidade e move o personagem.
     * Detecta colisão com o chão e com plataformas opcionais (quando caindo).
     */
    mover(plataformas = []) {
        this.velocidadeY += this.gravidade;

        let proximaPosicaoY = this.posicaoY + this.velocidadeY;
        let emPlataforma = false;

        // Se estiver caindo (velocidadeY > 0), verifica colisão com plataformas (nuvens)
        if (this.velocidadeY > 0) {
            let margemX = 35; // Desconta 35px de cada lado (espaço transparente da imagem) para a colisão do pé
            for (let plat of plataformas) {
                // Checa se está horizontalmente dentro da plataforma (usando a margem)
                if (this.posicaoX + this.largura - margemX > plat.posicaoX && this.posicaoX + margemX < plat.posicaoX + plat.largura) {
                    let peAtual = this.posicaoY + this.altura;
                    let peFuturo = proximaPosicaoY + this.altura;
                    // Se o pé vai atravessar a plataforma neste frame
                    if (peAtual <= plat.posicaoY && peFuturo >= plat.posicaoY) {
                        proximaPosicaoY = plat.posicaoY - this.altura;
                        this.velocidadeY = 0;
                        emPlataforma = true;
                        break;
                    }
                }
            }
        }

        this.posicaoY = proximaPosicaoY;

        if (this.temChao) {
            const chao = 500 - this.altura;
            if (this.posicaoY >= chao) {
                this.posicaoY = chao;
                this.velocidadeY = 0;
                this.noChao = true;
            } else if (emPlataforma) {
                this.noChao = true;
            } else {
                this.noChao = false;
            }
        } else {
            // Fase 2: Não tem chão, se errar a nuvem ele cai
            if (emPlataforma) {
                this.noChao = true;
            } else {
                this.noChao = false;
            }
        }

        // Mover horizontalmente
        this.posicaoX += this.velocidadeX;

        // Limites horizontais da tela
        if (this.posicaoX < 0) this.posicaoX = 0;
        if (this.posicaoX > 1024 - this.largura) this.posicaoX = 800 - this.largura;
    }

    /**
     * Inicia o pulo apenas se estiver no chão.
     */
    pular() {
        if (this.noChao) {
            this.velocidadeY = this.forcaDoPulo;
            this.noChao = false;
        }
    }
}

/**
 * Plataforma invisível (Nuvem) que o personagem pode pular em cima.
 */
class Plataforma extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura) {
        super(posicaoX, posicaoY, largura, altura, null);
    }
    desenharObjeto() {
        // As nuvens já estão desenhadas na imagem de fundo, 
        // mas caso queira depurar (ver as caixas):
        // contexto.fillStyle = 'rgba(255, 255, 255, 0.3)';
        // contexto.fillRect(this.posicaoX, this.posicaoY, this.largura, this.altura);
    }
}

// ─── Personagem Animado (Bombhat) ───────────
/**
 * Herda de Personagem e adiciona animação de sprites.
 * Sprites: 14.png (idle), 15-18.png (corrida, 4 frames).
 * Inverte horizontalmente quando corre para a esquerda.
 */
class PersonagemAnimado extends Personagem {
    constructor(posicaoX, posicaoY, largura, altura, pastaSprites, idleFile = '14.png', runFiles = ['15.png', '16.png', '17.png', '18.png']) {
        // Passa null como imagemSrc pois vamos controlar o desenho manualmente
        super(posicaoX, posicaoY, largura, altura, null);
        this.pastaSprites = pastaSprites; // ex: '../assets/Bombhat/'

        // Sprites disponíveis
        this.spriteIdle      = this.pastaSprites + idleFile;
        this.spritesCorrend  = runFiles.map(file => this.pastaSprites + file);

        // Estado de animação
        this.frameAtual       = 0;          // índice do frame de corrida atual
        this.contadorFrame    = 0;          // contador de ticks para trocar frame
        this.velocidadeFrame  = 6;          // a cada 6 ticks troca o frame
        this.olhandoParaDireita = true;     // direção que o sprite está virado
    }

    /**
     * Sobrescreve o mover para também atualizar a animação.
     */
    mover(plataformas = []) {
        super.mover(plataformas);

        // Se o personagem estiver se movendo horizontalmente, anima a corrida
        if (this.velocidadeX > 0) this.olhandoParaDireita = true;
        if (this.velocidadeX < 0) this.olhandoParaDireita = false;

        // Avança frame de corrida apenas se estiver se movendo no chão
        if (this.velocidadeX !== 0 && this.noChao) {
            this.contadorFrame++;
            if (this.contadorFrame >= this.velocidadeFrame) {
                this.contadorFrame = 0;
                this.frameAtual = (this.frameAtual + 1) % this.spritesCorrend.length;
            }
        } else if (this.velocidadeX === 0 && this.noChao) {
            // Parado no chão → resetar animação de corrida
            this.frameAtual    = 0;
            this.contadorFrame = 0;
        }
    }

    /**
     * Escolhe o sprite correto e desenha, espelhando se necessário.
     */
    desenharObjeto() {
        let srcSprite;

        if (!this.noChao) {
            // No ar (pulando ou caindo) → frame do meio da corrida (frame 1)
            srcSprite = this.spritesCorrend[1];
        } else if (this.velocidadeX !== 0) {
            // Correndo → anima frames 15-18
            srcSprite = this.spritesCorrend[this.frameAtual];
        } else {
            // Parado → idle (14)
            srcSprite = this.spriteIdle;
        }

        const img = pegarImagem(srcSprite);

        if (this.olhandoParaDireita) {
            // Desenho normal
            contexto.drawImage(img, this.posicaoX, this.posicaoY, this.largura, this.altura);
        } else {
            // Espelha horizontalmente para a esquerda
            contexto.save();
            contexto.translate(this.posicaoX + this.largura, this.posicaoY);
            contexto.scale(-1, 1);
            contexto.drawImage(img, 0, 0, this.largura, this.altura);
            contexto.restore();
        }
    }
}

// ─── Nave Animada (Bombhat – modo vertical fase 3) ─
/**
 * Herda de Nave e usa os sprites do Bombhat com animação flutuante.
 * Fase 3 usa movimento vertical, então o sprite sempre olha para a direita.
 * Anima os frames 15-18 enquanto se move, e idle (14) quando parado.
 */
class NaveAnimada extends Nave {
    constructor(posicaoX, posicaoY, largura, altura, pastaSprites) {
        super(posicaoX, posicaoY, largura, altura, null);
        this.pastaSprites = pastaSprites;

        this.spriteIdle     = this.pastaSprites + '14.png';
        this.spritesMovend  = [
            this.pastaSprites + '15.png',
            this.pastaSprites + '16.png',
            this.pastaSprites + '17.png',
            this.pastaSprites + '18.png',
        ];

        this.frameAtual      = 0;
        this.contadorFrame   = 0;
        this.velocidadeFrame = 6;
    }

    mover() {
        super.mover();

        // Avança animação enquanto se move verticalmente
        if (this.direcaoDeMovimento !== 0) {
            this.contadorFrame++;
            if (this.contadorFrame >= this.velocidadeFrame) {
                this.contadorFrame = 0;
                this.frameAtual = (this.frameAtual + 1) % this.spritesMovend.length;
            }
        } else {
            this.frameAtual    = 0;
            this.contadorFrame = 0;
        }
    }

    desenharObjeto() {
        const srcSprite = (this.direcaoDeMovimento !== 0)
            ? this.spritesMovend[this.frameAtual]
            : this.spriteIdle;

        contexto.drawImage(pegarImagem(srcSprite), this.posicaoX, this.posicaoY, this.largura, this.altura);
    }
}

// ─── Disco (inimigo) ───────────────────────
class Disco extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc, velocidade) {
        super(posicaoX, posicaoY, largura, altura, imagemSrc);
        this.velocidadeDeQueda = velocidade || (Math.random() * (6 - 3) + 3);
    }

    mover() {
        this.posicaoX -= this.velocidadeDeQueda;
    }
}

// ─── Tiro ──────────────────────────────────
class Tiro extends ObjetoDoJogo {
    desenharTiro() {
        if (this.imagemSrc && this.imagemSrc !== 'red') {
            contexto.drawImage(pegarImagem(this.imagemSrc), this.posicaoX, this.posicaoY, this.largura, this.altura);
        } else {
            contexto.fillStyle = '#00eeff';
            contexto.shadowColor = '#00eeff';
            contexto.shadowBlur = 8;
            contexto.fillRect(this.posicaoX, this.posicaoY, this.largura, this.altura);
            contexto.shadowBlur = 0;
        }
    }

    mover() {
        this.posicaoX += 10;
    }
}

// ─── Tiro do Boss ──────────────────────────
class TiroBoss extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc, dano = 1, velocidade = 10, velocidadeY = 0) {
        super(posicaoX, posicaoY, largura, altura, imagemSrc);
        this.dano = dano;
        this.velocidade = velocidade;
        this.velocidadeY = velocidadeY;
    }

    desenharTiro() {
        if (this.imagemSrc && this.imagemSrc !== 'red') {
            contexto.drawImage(pegarImagem(this.imagemSrc), this.posicaoX, this.posicaoY, this.largura, this.altura);
        } else {
            contexto.fillStyle = '#ff3333';
            contexto.shadowColor = '#ff3333';
            contexto.shadowBlur = 8;
            contexto.fillRect(this.posicaoX, this.posicaoY, this.largura, this.altura);
            contexto.shadowBlur = 0;
        }
    }

    mover() {
        this.posicaoX -= this.velocidade;
        this.posicaoY += this.velocidadeY;
    }
}

// ─── Tipos de tiro dos bosses ──────────────
/**
 * Os 3 bosses compartilham os mesmos 3 tipos de ataque, mudando só o sprite
 * e o tamanho base do projétil de cada fase.
 *
 * RAPIDO  → projétil pequeno e veloz, dano 1
 * PESADO  → projétil grande e lento, dano 3
 * DUPLO   → dois projéteis em leque (um sobe, outro desce), dano 1 cada
 */
const TIPOS_DE_TIRO_DO_BOSS = ['RAPIDO', 'PESADO', 'DUPLO'];

function criarTiroAleatorioDoBoss(boss, imagemSrc, larguraBase, alturaBase) {
    const tipoSorteado = TIPOS_DE_TIRO_DO_BOSS[Math.floor(Math.random() * TIPOS_DE_TIRO_DO_BOSS.length)];
    const centroY = boss.posicaoY + boss.altura / 2;

    if (tipoSorteado === 'RAPIDO') {
        const largura = larguraBase * 0.7;
        const altura = alturaBase * 0.7;
        return [new TiroBoss(boss.posicaoX, centroY - altura / 2, largura, altura, imagemSrc, 1, 16)];
    }

    if (tipoSorteado === 'PESADO') {
        const largura = larguraBase * 1.6;
        const altura = alturaBase * 1.6;
        return [new TiroBoss(boss.posicaoX, centroY - altura / 2, largura, altura, imagemSrc, 2, 5)];
    }

    // DUPLO — um projétil abre para cima e outro para baixo
    const largura = larguraBase * 0.8;
    const altura = alturaBase * 0.8;
    return [
        new TiroBoss(boss.posicaoX, centroY - altura / 2, largura, altura, imagemSrc, 1, 10, -2.5),
        new TiroBoss(boss.posicaoX, centroY - altura / 2, largura, altura, imagemSrc, 1, 10, 2.5),
    ];
}

// ─── Fundo do Jogo (faixas scrolláveis) ────
class Fundo extends ObjetoDoJogo {
    mover(limiteInicial, limiteFinal) {
        this.posicaoY += 2;
        if (this.posicaoY > limiteFinal) this.posicaoY = limiteInicial;
    }
}

// ─── Texto helper ──────────────────────────
class Texto {
    desenharTexto(textoParaMostrar, posicaoX, posicaoY, corDoTexto, fonteDoTexto) {
        contexto.font = fonteDoTexto || '20px Georgia';
        contexto.fillStyle = corDoTexto || 'white';
        contexto.textAlign = 'left';
        contexto.fillText(textoParaMostrar, posicaoX, posicaoY);
    }
}