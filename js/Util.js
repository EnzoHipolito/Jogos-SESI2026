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
        if (this.posicaoX > 800 - this.largura - 10) this.posicaoX = 800 - this.largura - 10;
        if (this.posicaoY < 10) this.posicaoY = 10;
        if (this.posicaoY > 560 - this.altura - 10) this.posicaoY = 560 - this.altura - 10;
    }
}

// ─── Nave do jogador ───────────────────────
class Nave extends ObjetoDoJogo {
    constructor(posicaoX, posicaoY, largura, altura, imagemSrc) {
        super(posicaoX, posicaoY, largura, altura, imagemSrc);
        this.direcaoDeMovimento = 0;
        this.pontos = 0;
        this.vida = 5;
    }

    mover() {
        this.posicaoY += this.direcaoDeMovimento;
        if (this.posicaoY <= 0)   this.posicaoY = 0;
        if (this.posicaoY >= 560 - this.altura) this.posicaoY = 560 - this.altura;
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
        contexto.fillStyle = '#00eeff';
        contexto.shadowColor = '#00eeff';
        contexto.shadowBlur = 8;
        contexto.fillRect(this.posicaoX, this.posicaoY, this.largura, this.altura);
        contexto.shadowBlur = 0;
    }

    mover() {
        this.posicaoX += 10;
    }
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