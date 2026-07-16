let contexto = document.getElementById('des').getContext('2d')
let elementoCanvasDoJogo = document.getElementById('des')

const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemDeResultado = ''

let configuracaoDaFase = fasesDoJogo[ID_DA_FASE];

// ─── Vida máxima do jogador (para limitar cura dos coletáveis) ────────────────
let vidaMaximaDoJogador = 0;

let fundoDoCenario = new Fundo(0, 0, 1024, 640, '../assets/backgroundFase3.png')
let naveDoJogador = new Nave(50, 270, 180, 110, '../assets/aviao_bombhead/bombhead_aviao.png') // Avião com todos os personagens

let textoFixoDeVidas = new Texto()
let textoComValorDeVidas = new Texto()
let textoFixoDePontos = new Texto()
let textoComValorDePontos = new Texto()

let listaDeTirosDisparados = []
let listaDeTirosDoBoss = []
let gerenciadorDeTiros = {
    desenharNaTela() {
        listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
            tiroDisparadoAgora.desenharTiro()
        })
    },
    atualizarPosicoes() {
        listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
            tiroDisparadoAgora.mover()
            if (tiroDisparadoAgora.posicaoX >= 810) {
                listaDeTirosDisparados.splice(listaDeTirosDisparados.indexOf(tiroDisparadoAgora), 1)
            }
        })
    }
}

let bossDaFase = {
    posicaoX: 620,
    posicaoY: 200,
    largura: 250,
    altura: 250,
    imagemSrc: '../assets/aviao_vilao/31-removebg-preview.png',
    imagemTiro: '../assets/aviao_vilao/32-removebg-preview.png',
    tempoTiro: 0,
    direcaoVertical: 1,
    velocidade: 2.5,
    vidaDoBoss: 0,
    vidaMaximaDoBoss: 0,
    contadorDeTiro: 0,

    iniciar() {
        this.posicaoX = 720
        this.posicaoY = 200
        this.direcaoVertical = 1
        this.vidaMaximaDoBoss = 32
        this.vidaDoBoss = this.vidaMaximaDoBoss
        this.contadorDeTiro = 0
        this.tempoTiro = 0
    },

    /**
     * Move o boss devagar pra cima e pra baixo, quicando nas bordas.
     */
    mover() {
        this.posicaoY += this.velocidade * this.direcaoVertical
        if (this.posicaoY <= 10) {
            this.posicaoY = 10
            this.direcaoVertical = 1
        }
        if (this.posicaoY >= 640 - this.altura - 10) {
            this.posicaoY = 640 - this.altura - 10
            this.direcaoVertical = -1
        }
    },

    desenharObjeto() {
        let img = pegarImagem(this.tempoTiro > 0 ? this.imagemTiro : this.imagemSrc);
        if (this.tempoTiro > 0) this.tempoTiro--;
        contexto.drawImage(img, this.posicaoX, this.posicaoY, this.largura, this.altura)

        // Barra de vida do boss (acima dele)
        let porcentagemVida = this.vidaDoBoss / this.vidaMaximaDoBoss
        let larguraDaBarra = this.largura
        contexto.fillStyle = 'rgba(0, 0, 0, 0.5)'
        contexto.fillRect(this.posicaoX, this.posicaoY - 18, larguraDaBarra, 12)
        contexto.fillStyle = porcentagemVida > 0.3 ? '#00ff44' : '#ff3333'
        contexto.fillRect(this.posicaoX, this.posicaoY - 18, larguraDaBarra * porcentagemVida, 12)
        // Borda da barra
        contexto.strokeStyle = 'white'
        contexto.lineWidth = 1
        contexto.strokeRect(this.posicaoX, this.posicaoY - 18, larguraDaBarra, 12)
    },

    colidiuCom(outroObjeto) {
        return verificarColisao(this, outroObjeto)
    },

    atirar() {
        this.contadorDeTiro += 1
        if (this.contadorDeTiro >= configuracaoDaFase.taxaDeCriacao[0]) {
            this.contadorDeTiro = 0
            this.tempoTiro = 20;
            SoundManager.tocarSomTiroBoss()
            criarTiroAleatorioDoBoss(this, '../assets/tiro_aviao_aviao/tiroaviao03.png', 100, 50, true).forEach((tiroCriado) => listaDeTirosDoBoss.push(tiroCriado))
        }
    }
}

let cooldownDeColisao = 0

document.addEventListener('keydown', (eventoTeclado) => {
    SoundManager.inicializar() // garante AudioContext após interação do usuário
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') naveDoJogador.direcaoDeMovimento = -5
        if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') naveDoJogador.direcaoDeMovimento = 5
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') naveDoJogador.direcaoDeMovimentoX = -5
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') naveDoJogador.direcaoDeMovimentoX = 5
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        if (eventoTeclado.key === 'Enter') {
            window.location.href = "mapa.html"
        }
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') naveDoJogador.direcaoDeMovimento = 0
        if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') naveDoJogador.direcaoDeMovimento = 0
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') naveDoJogador.direcaoDeMovimentoX = 0
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') naveDoJogador.direcaoDeMovimentoX = 0
    }

    if (eventoTeclado.key === 'Escape') {
        if (!window.saindo) {
            window.saindo = true;
            window.location.href = "mapa.html"
        }
    }
})

document.addEventListener('keypress', (eventoTeclado) => {
    if (estadoAtualDaFase !== ESTADOS_DA_FASE.JOGANDO) return
    if (eventoTeclado.key === 'g' || eventoTeclado.key === 'G') {
        if (naveDoJogador.cooldownTiro <= 0) {
            listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura / 2 + 10, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 10, 120, 60, '../assets/tiros_personagens/tiros_personagens.png'))
            naveDoJogador.cooldownTiro = 15;
            SoundManager.tocarSomTiro()
        }
    }
})

function iniciarFase() {
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    vidaMaximaDoJogador = configuracaoDaFase.vidasDaFase
    naveDoJogador.pontos = 0
    naveDoJogador.posicaoX = 50
    naveDoJogador.posicaoY = 245
    naveDoJogador.direcaoDeMovimento = 0
    naveDoJogador.direcaoDeMovimentoX = 0
    listaDeTirosDisparados = []
    listaDeTirosDoBoss = []
    bossDaFase.iniciar()
    cooldownDeColisao = 0
    inicializarColetaveis()
    SoundManager.resetarResultado()

    elementoCanvasDoJogo.style.cursor = 'default'
    estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO

}

/**
 * Verifica se a nave do jogador encostou no boss.
 * Usa um cooldown para não descontar vida continuamente.
 */
function conferirBatidaDaNaveComBoss() {
    if (cooldownDeColisao > 0) {
        cooldownDeColisao -= 1
        return
    }
    if (bossDaFase.colidiuCom(naveDoJogador)) {
        naveDoJogador.vida -= 1
        cooldownDeColisao = 60
        SoundManager.tocarSomDano()
    }
}

/**
 * Verifica se algum tiro acertou o boss.
 * Se sim, remove o tiro, diminui a vida do boss e dá 1 ponto.
 */
function conferirTirosNoBoss() {
    listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
        if (bossDaFase.colidiuCom(tiroDisparadoAgora)) {
            listaDeTirosDisparados.splice(listaDeTirosDisparados.indexOf(tiroDisparadoAgora), 1)
            bossDaFase.vidaDoBoss -= 1
            SoundManager.tocarSomImpacto()
        }
    })
}

/**
 * Verifica se os tiros disparados pelo boss acertaram a nave.
 */
function conferirTirosDoBossNaNave() {
    listaDeTirosDoBoss.forEach((tiro) => {
        if (naveDoJogador.colidiuCom(tiro)) {
            listaDeTirosDoBoss.splice(listaDeTirosDoBoss.indexOf(tiro), 1)
            naveDoJogador.vida -= tiro.dano
            SoundManager.tocarSomDano()
        }
    })
}

/**
 * Exibe a tela de resultado no fim da fase (Vitória ou Derrota).
 * Desenha um fundo semi-transparente por cima do jogo com a mensagem final.
 */
function desenharTelaDeVitoriaOuDerrota() {
    contexto.fillStyle = 'rgba(0, 0, 0, 0.7)'
    contexto.fillRect(0, 0, 1024, 640)

    if (mensagemDeResultado === 'VITÓRIA!') {
        contexto.drawImage(pegarImagem('../assets/vc_ganhou.png'), 212, 100, 600, 400)
        contexto.fillStyle = 'white'
        contexto.textAlign = 'center'
        contexto.font = 'bold 20px Arial'
        contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 512, 550)
        // Exibir pontuação final
        contexto.font = 'bold 24px Arial'
        contexto.fillStyle = '#FFD700'
        contexto.fillText('Pontuação: ' + naveDoJogador.pontos + ' pts', 512, 510)
    } else {
        contexto.fillStyle = 'white'
        contexto.textAlign = 'center'
        contexto.font = 'bold 50px Arial'
        contexto.fillText(mensagemDeResultado, 512, 300)
        contexto.font = '20px Arial'
        contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 512, 360)
        // Exibir pontuação final
        contexto.font = 'bold 22px Arial'
        contexto.fillStyle = '#FFD700'
        contexto.fillText('Pontuação: ' + naveDoJogador.pontos + ' pts', 512, 400)
    }
}

function desenharGraficosDoNivel() {
    fundoDoCenario.desenharObjeto()
    naveDoJogador.desenharObjeto()
    gerenciadorDeTiros.desenharNaTela()
    listaDeTirosDoBoss.forEach((tiro) => tiro.desenharTiro())
    bossDaFase.desenharObjeto()
    desenharColetaveis(contexto)

    textoFixoDeVidas.desenharTexto('Vidas:', 640, 40, 'white', '30px Georgia')
    textoComValorDeVidas.desenharTexto(naveDoJogador.vida, 740, 40, 'red', '30px Georgia')
    textoFixoDePontos.desenharTexto('Pontos:', 640, 75, 'white', '22px Georgia')
    textoComValorDePontos.desenharTexto(naveDoJogador.pontos, 760, 75, '#FFD700', '22px Georgia')

    // Instrução ESC
    contexto.textAlign = 'center'
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Mapa', 512, 620)
}

function atualizarCalculosDoNivel() {
    if (naveDoJogador.cooldownTiro > 0) naveDoJogador.cooldownTiro--
    naveDoJogador.mover()
    gerenciadorDeTiros.atualizarPosicoes()
    
    bossDaFase.mover()
    bossDaFase.atirar()
    listaDeTirosDoBoss.forEach((tiro) => {
        tiro.mover()
        if (tiro.posicaoX <= -20) {
            listaDeTirosDoBoss.splice(listaDeTirosDoBoss.indexOf(tiro), 1)
        }
    })

    atualizarColetaveis(naveDoJogador, vidaMaximaDoJogador)
    conferirTirosNoBoss()
    conferirBatidaDaNaveComBoss()
    conferirTirosDoBossNaNave()

    if (naveDoJogador.vida <= 0) {
        mensagemDeResultado = 'DERROTA!'
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        SoundManager.tocarSomDerrota()
    } else if (bossDaFase.vidaDoBoss <= 0) {
        mensagemDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[ID_DA_FASE] = true
        salvarProgresso() // Salva as fases destravadas no localStorage
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        SoundManager.tocarSomVitoria()
    }
}

/**
 * Função principal (Game Loop). Roda continuamente a cada frame renderizado pelo navegador.
 * Limpa o canvas e chama as funções de desenho e atualização de acordo com o estado do jogo.
 */
function principal() {
    contexto.clearRect(0, 0, 1024, 640)

    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        desenharGraficosDoNivel()
        atualizarCalculosDoNivel()
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        desenharGraficosDoNivel() // Mantém o jogo de fundo
        desenharTelaDeVitoriaOuDerrota() // Desenha tela de vitória/derrota por cima
    }

    requestAnimationFrame(principal)
}

iniciarFase()
principal()
