let contexto = document.getElementById('des').getContext('2d')
let elementoCanvasDoJogo = document.getElementById('des')

// ─── Estados da Fase ─────────────────────────
const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemDeResultado = ''

// A variável global ID_DA_FASE deve vir do HTML (0, 1 ou 2)
let configuracaoDaFase = fasesDoJogo[ID_DA_FASE];

// ─── Objetos Básicos ─────────────────────────
// Utilizando um background estático que não se repete
let fundoDoCenario = new Fundo(0, 0, 800, 560, 'assets/backgroundFase2.png')
let naveDoJogador = new Nave(50, 270, 130, 80, 'assets/personagens_inicio.png') // Ajustei a largura/altura para nave deitada

let textoFixoDePontos = new Texto()
let textoComValorDePontos = new Texto()
let textoFixoDeVidas = new Texto()
let textoComValorDeVidas = new Texto()
const audioMotorDaNave = new Audio('assets/nave_som.mp3')
const audioDeColisao = new Audio('assets/batida.mp3')
audioMotorDaNave.volume = 1.0
audioMotorDaNave.loop = true
audioDeColisao.volume = 0.7

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

// ─── Boss da Fase (inimigo único) ─────────────
let bossDaFase = {
    posicaoX: 620,
    posicaoY: 200,
    largura: 150,
    altura: 150,
    imagemSrc: 'assets/disco2.png',
    direcaoVertical: 1,
    velocidade: 2.0,
    vidaDoBoss: 0,
    vidaMaximaDoBoss: 0,
    contadorDeTiro: 0,

    /**
     * Inicializa o boss no começo da fase.
     * A vida do boss é igual aos pontos necessários para vencer.
     */
    iniciar() {
        this.posicaoX = 620
        this.posicaoY = 200
        this.direcaoVertical = 1
        this.vidaMaximaDoBoss = configuracaoDaFase.pontosParaVencer
        this.vidaDoBoss = this.vidaMaximaDoBoss
        this.contadorDeTiro = 0
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
        if (this.posicaoY >= 560 - this.altura - 10) {
            this.posicaoY = 560 - this.altura - 10
            this.direcaoVertical = -1
        }
    },

    /**
     * Desenha o boss na tela junto com sua barra de vida.
     */
    desenharObjeto() {
        contexto.drawImage(pegarImagem(this.imagemSrc), this.posicaoX, this.posicaoY, this.largura, this.altura)

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

    /**
     * Verifica se o boss colidiu com outro objeto (nave ou tiro).
     */
    colidiuCom(outroObjeto) {
        return (this.posicaoX < outroObjeto.posicaoX + outroObjeto.largura) &&
               (this.posicaoX + this.largura > outroObjeto.posicaoX) &&
               (this.posicaoY < outroObjeto.posicaoY + outroObjeto.altura) &&
               (this.posicaoY + this.altura > outroObjeto.posicaoY)
    },

    /**
     * O boss atira um TiroBoss em direção à nave do jogador periodicamente.
     */
    atirar() {
        this.contadorDeTiro += 1
        if (this.contadorDeTiro >= configuracaoDaFase.taxaDeCriacao[0]) {
            this.contadorDeTiro = 0
            listaDeTirosDoBoss.push(new TiroBoss(this.posicaoX, this.posicaoY + this.altura / 2 - 4, 16, 8, 'red'))
        }
    }
}

// Cooldown para evitar que encostar no boss tire todas as vidas de uma vez
let cooldownDeColisao = 0

document.addEventListener('keydown', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') naveDoJogador.direcaoDeMovimento = -5
        if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') naveDoJogador.direcaoDeMovimento = 5
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        if (eventoTeclado.key === 'Enter') {
            window.location.href = "mapa.html"
        }
    }

    if (eventoTeclado.key === 'Escape') {
        window.location.href = "mapa.html"
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') naveDoJogador.direcaoDeMovimento = 0
        if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') naveDoJogador.direcaoDeMovimento = 0
    }
})

document.addEventListener('keypress', (eventoTeclado) => {
    if (estadoAtualDaFase !== ESTADOS_DA_FASE.JOGANDO) return
    if (eventoTeclado.key === 'l' || eventoTeclado.key === 'z') {
        listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 4, 16, 8, 'red'))
    }
})

// ─── Lógica ──────────────────────────────────

/**
 * Função responsável por inicializar todas as variáveis de estado antes de começar a fase.
 * Reseta pontos, vidas, posição inicial da nave e listas de inimigos e tiros.
 */
function iniciarFase() {
    naveDoJogador.pontos = 0
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador.posicaoX = 50
    naveDoJogador.posicaoY = 245
    naveDoJogador.direcaoDeMovimento = 0
    listaDeTirosDisparados = []
    listaDeTirosDoBoss = []
    bossDaFase.iniciar()
    cooldownDeColisao = 0

    elementoCanvasDoJogo.style.cursor = 'default'
    estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO

    try { audioMotorDaNave.currentTime = 0; audioMotorDaNave.play().catch(() => { }) } catch (erroDoNavegador) { }
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
        cooldownDeColisao = 60 // ~1 segundo de invencibilidade
        try { audioDeColisao.currentTime = 0; audioDeColisao.play().catch(() => { }) } catch (erroDoNavegador) { }
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
            naveDoJogador.pontos += 1
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
            naveDoJogador.vida -= 1
            try { audioDeColisao.currentTime = 0; audioDeColisao.play().catch(() => { }) } catch (erroDoNavegador) { }
        }
    })
}

/**
 * Exibe a tela de resultado no fim da fase (Vitória ou Derrota).
 * Desenha um fundo semi-transparente por cima do jogo com a mensagem final.
 */
function desenharTelaDeVitoriaOuDerrota() {
    contexto.fillStyle = 'rgba(0, 0, 0, 0.7)'
    contexto.fillRect(0, 0, 800, 560)
    contexto.fillStyle = 'white'
    contexto.textAlign = 'center'
    contexto.font = 'bold 50px Arial'
    contexto.fillText(mensagemDeResultado, 400, 260)
    contexto.font = '20px Arial'
    contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 400, 320)
}

/**
 * Renderiza todos os objetos da fase na tela a cada frame (cenários, nave, tiros, inimigos).
 * Também desenha a interface de usuário (HUD) com pontos e vidas.
 */
function desenharGraficosDoNivel() {
    fundoDoCenario.desenharObjeto()
    naveDoJogador.desenharObjeto()
    gerenciadorDeTiros.desenharNaTela()
    listaDeTirosDoBoss.forEach((tiro) => tiro.desenharTiro())
    bossDaFase.desenharObjeto()

    textoFixoDePontos.desenharTexto('Pontos:', 20, 40, 'white', '30px Georgia')
    textoComValorDePontos.desenharTexto(`${naveDoJogador.pontos}/${configuracaoDaFase.pontosParaVencer}`, 130, 40, 'white', '30px Georgia')
    textoFixoDeVidas.desenharTexto('Vidas:', 640, 40, 'white', '30px Georgia')
    textoComValorDeVidas.desenharTexto(naveDoJogador.vida, 740, 40, 'white', '30px Georgia')

    // Instrução ESC
    contexto.textAlign = 'center'
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Mapa', 400, 540)
}

/**
 * Atualiza o estado lógico de todos os objetos em tela.
 * Movimenta nave, gerencia posição de tiros e inimigos.
 * Também checa se o jogador perdeu todas as vidas ou atingiu os pontos necessários.
 */
function atualizarCalculosDoNivel() {
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

    conferirTirosNoBoss()
    conferirBatidaDaNaveComBoss()
    conferirTirosDoBossNaNave()

    if (naveDoJogador.vida <= 0) {
        mensagemDeResultado = 'DERROTA!'
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        audioMotorDaNave.pause()
    } else if (naveDoJogador.pontos >= configuracaoDaFase.pontosParaVencer) {
        mensagemDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[ID_DA_FASE] = true
        salvarProgresso() // Salva as fases destravadas no localStorage
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        audioMotorDaNave.pause()
    }
}

/**
 * Função principal (Game Loop). Roda continuamente a cada frame renderizado pelo navegador.
 * Limpa o canvas e chama as funções de desenho e atualização de acordo com o estado do jogo.
 */
function rodarTickDoJogoPrincipal() {
    contexto.clearRect(0, 0, 800, 560)

    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        desenharGraficosDoNivel()
        atualizarCalculosDoNivel()
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        desenharGraficosDoNivel() // Mantém o jogo de fundo
        desenharTelaDeVitoriaOuDerrota() // Desenha tela de vitória/derrota por cima
    }

    requestAnimationFrame(rodarTickDoJogoPrincipal)
}

iniciarFase()
rodarTickDoJogoPrincipal()
