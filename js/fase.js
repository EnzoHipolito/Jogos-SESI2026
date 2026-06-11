let contexto = document.getElementById('des').getContext('2d')
let elementoCanvasDoJogo = document.getElementById('des')

// ─── Estados da Fase ─────────────────────────
const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemFinalDeResultado = ''

// A variável global ID_DA_FASE deve vir do HTML (0, 1 ou 2)
let configuracaoDaFaseAtual = fasesDoJogo[ID_DA_FASE];

// ─── Objetos Básicos ─────────────────────────
let fundoCenario1 = new Fundo(0, 0, 800, 560, 'assets/background.jpg')
let fundoCenario2 = new Fundo(0, -560, 800, 560, 'assets/background2.jpg')
let fundoCenario3 = new Fundo(0, -1120, 800, 560, 'assets/background.jpg')
let fundoCenario4 = new Fundo(0, -1680, 800, 560, 'assets/background2.jpg')
let navePrincipalDoJogador = new Nave(375, 470, 50, 70, 'assets/nave.png')

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
let gerenciadorDeTiros = {
    desenharNaTela() {
        listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
            tiroDisparadoAgora.desenharTiro()
        })
    },
    atualizarPosicoes() {
        listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
            tiroDisparadoAgora.mover()
            if (tiroDisparadoAgora.posicaoY <= -10) {
                listaDeTirosDisparados.splice(listaDeTirosDisparados.indexOf(tiroDisparadoAgora), 1)
            }
        })
    }
}

let listaDeDiscosInimigos = []
let gerenciadorDeDiscos = {
    contadorTempoInimigo1: 0,
    contadorTempoInimigo2: 0,
    contadorTempoInimigo3: 0,

    criarInimigosNovos() {
        if (!configuracaoDaFaseAtual) return; // Só cria se tiver fase ativa
        this.contadorTempoInimigo1 += 1
        this.contadorTempoInimigo2 += 1
        this.contadorTempoInimigo3 += 1
        let posicaoAleatoriaX1 = (Math.random() * (738 - 2 + 1) + 2)
        let posicaoAleatoriaX2 = (Math.random() * (738 - 2 + 1) + 2)
        let posicaoAleatoriaX3 = (Math.random() * (738 - 2 + 1) + 2)

        // Pega as velocidades da fase
        let velocidadeMinima = configuracaoDaFaseAtual.velocidadeDosInimigos[0]
        let velocidadeMaxima = configuracaoDaFaseAtual.velocidadeDosInimigos[1]
        let calculaSorteioVelocidade = () => Math.random() * (velocidadeMaxima - velocidadeMinima) + velocidadeMinima

        if (this.contadorTempoInimigo1 >= configuracaoDaFaseAtual.taxaDeCriacao[0]) {
            this.contadorTempoInimigo1 = 0
            listaDeDiscosInimigos.push(new Disco(posicaoAleatoriaX1, -200, 50, 50, 'assets/disco.png', calculaSorteioVelocidade()))
        }
        if (this.contadorTempoInimigo2 >= configuracaoDaFaseAtual.taxaDeCriacao[1]) {
            this.contadorTempoInimigo2 = 0
            listaDeDiscosInimigos.push(new Disco(posicaoAleatoriaX2, -300, 50, 50, 'assets/disco2.png', calculaSorteioVelocidade()))
        }
        if (this.contadorTempoInimigo3 >= configuracaoDaFaseAtual.taxaDeCriacao[2]) {
            this.contadorTempoInimigo3 = 0
            listaDeDiscosInimigos.push(new Disco(posicaoAleatoriaX3, -400, 50, 50, 'assets/disco3.png', calculaSorteioVelocidade()))
        }
    },
    desenharNaTela() {
        listaDeDiscosInimigos.forEach((discoInimigoAparecendo) => {
            discoInimigoAparecendo.desenharObjeto()
        })
    },
    destruirSeAcertouTiro() {
        listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
            listaDeDiscosInimigos.forEach((discoInimigoAparecendo) => {
                if (tiroDisparadoAgora.colidiuCom(discoInimigoAparecendo)) {
                    listaDeTirosDisparados.splice(listaDeTirosDisparados.indexOf(tiroDisparadoAgora), 1)
                    listaDeDiscosInimigos.splice(listaDeDiscosInimigos.indexOf(discoInimigoAparecendo), 1)
                    navePrincipalDoJogador.pontos += 1
                }
            })
        })
    },
    atualizarPosicoes() {
        this.criarInimigosNovos()
        this.destruirSeAcertouTiro()
        listaDeDiscosInimigos.forEach((discoInimigoAparecendo) => {
            discoInimigoAparecendo.mover()
            if (discoInimigoAparecendo.posicaoY >= 570) {
                listaDeDiscosInimigos.splice(listaDeDiscosInimigos.indexOf(discoInimigoAparecendo), 1)
            }
        })
    }
}

document.addEventListener('keydown', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') navePrincipalDoJogador.direcaoDeMovimento = -5
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') navePrincipalDoJogador.direcaoDeMovimento = 5
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
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') navePrincipalDoJogador.direcaoDeMovimento = 0
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') navePrincipalDoJogador.direcaoDeMovimento = 0
    }
})

document.addEventListener('keypress', (eventoTeclado) => {
    if (estadoAtualDaFase !== ESTADOS_DA_FASE.JOGANDO) return
    if (eventoTeclado.key === 'l' || eventoTeclado.key === 'z') {
        listaDeTirosDisparados.push(new Tiro(navePrincipalDoJogador.posicaoX - 4 + navePrincipalDoJogador.largura / 2, navePrincipalDoJogador.posicaoY, 8, 16, 'red'))
    }
})

// ─── Lógica ──────────────────────────────────
function iniciarFase() {
    navePrincipalDoJogador.pontos = 0
    navePrincipalDoJogador.vida = configuracaoDaFaseAtual.vidasDaFase
    navePrincipalDoJogador.posicaoX = 375
    navePrincipalDoJogador.direcaoDeMovimento = 0
    listaDeTirosDisparados = []
    listaDeDiscosInimigos = []
    gerenciadorDeDiscos.contadorTempoInimigo1 = 0
    gerenciadorDeDiscos.contadorTempoInimigo2 = 0
    gerenciadorDeDiscos.contadorTempoInimigo3 = 0

    elementoCanvasDoJogo.style.cursor = 'default'
    estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO

    try { audioMotorDaNave.currentTime = 0; audioMotorDaNave.play().catch(() => { }) } catch (erroDoNavegador) { }
}

function conferirBatidaDaNaveComInimigos() {
    listaDeDiscosInimigos.forEach((discoInimigoAparecendo) => {
        if (navePrincipalDoJogador.colidiuCom(discoInimigoAparecendo)) {
            listaDeDiscosInimigos.splice(listaDeDiscosInimigos.indexOf(discoInimigoAparecendo), 1)
            navePrincipalDoJogador.vida -= 1
            try { audioDeColisao.currentTime = 0; audioDeColisao.play().catch(() => { }) } catch (erroDoNavegador) { }
        }
    })
}

function desenharTelaDeVitoriaOuDerrota() {
    contexto.fillStyle = 'rgba(0, 0, 0, 0.7)'
    contexto.fillRect(0, 0, 800, 560)
    contexto.fillStyle = 'white'
    contexto.textAlign = 'center'
    contexto.font = 'bold 50px Arial'
    contexto.fillText(mensagemFinalDeResultado, 400, 260)
    contexto.font = '20px Arial'
    contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 400, 320)
}

function desenharGraficosDoNivel() {
    fundoCenario1.desenharObjeto()
    fundoCenario2.desenharObjeto()
    fundoCenario3.desenharObjeto()
    fundoCenario4.desenharObjeto()
    navePrincipalDoJogador.desenharObjeto()
    gerenciadorDeTiros.desenharNaTela()
    gerenciadorDeDiscos.desenharNaTela()

    textoFixoDePontos.desenharTexto('Pontos:', 20, 40, 'white', '30px Georgia')
    textoComValorDePontos.desenharTexto(`${navePrincipalDoJogador.pontos}/${configuracaoDaFaseAtual.pontosParaVencer}`, 130, 40, 'white', '30px Georgia')
    textoFixoDeVidas.desenharTexto('Vidas:', 640, 40, 'white', '30px Georgia')
    textoComValorDeVidas.desenharTexto(navePrincipalDoJogador.vida, 740, 40, 'white', '30px Georgia')

    // Instrução ESC
    contexto.textAlign = 'center'
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Mapa', 400, 540)
}

function atualizarCalculosDoNivel() {
    fundoCenario1.mover(0, 1680)
    fundoCenario2.mover(-560, 1120)
    fundoCenario3.mover(-1120, 560)
    fundoCenario4.mover(-1680, 0)
    navePrincipalDoJogador.mover()
    gerenciadorDeTiros.atualizarPosicoes()
    gerenciadorDeDiscos.atualizarPosicoes()
    conferirBatidaDaNaveComInimigos()

    if (navePrincipalDoJogador.vida <= 0) {
        mensagemFinalDeResultado = 'DERROTA!'
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        audioMotorDaNave.pause()
    } else if (navePrincipalDoJogador.pontos >= configuracaoDaFaseAtual.pontosParaVencer) {
        mensagemFinalDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[ID_DA_FASE] = true
        salvarProgresso() // Salva as fases destravadas no localStorage
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        audioMotorDaNave.pause()
    }
}

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
