let contexto = document.getElementById('des').getContext('2d')
let elementoCanvasDoJogo = document.getElementById('des')

// ─── Estados do Jogo ─────────────────────────
const ESTADOS_DO_JOGO = { MAPA: 'MAPA', JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDoJogo = ESTADOS_DO_JOGO.MAPA
let indiceDaFaseSelecionada = 0
let configuracaoDaFaseAtual = null
let mensagemFinalDeResultado = ''

// ─── Objetos Básicos ─────────────────────────
let fundoCenario1 = new Fundo(0, 0, 800, 560, 'assets/background.jpg')
let fundoCenario2 = new Fundo(0, -560, 800, 560, 'assets/background2.jpg')
let fundoCenario3 = new Fundo(0, -1120, 800, 560, 'assets/background.jpg')
let fundoCenario4 = new Fundo(0, -1680, 800, 560, 'assets/background2.jpg')
let navePrincipalDoJogador = new Nave(375, 470, 50, 70, 'assets/nave.png')

// Herói que anda no mapa
let personagemNoMapa = new HeroiMapa(170, 260, 90, 70, 'assets/personagens_inicio.png')

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

// ─── Controles Teclado ──────────────────────────
document.addEventListener('keydown', (eventoTeclado) => {
    if (estadoAtualDoJogo === ESTADOS_DO_JOGO.MAPA) {
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') personagemNoMapa.direcaoX = -personagemNoMapa.velocidade
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') personagemNoMapa.direcaoX = personagemNoMapa.velocidade
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') personagemNoMapa.direcaoY = -personagemNoMapa.velocidade
        if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') personagemNoMapa.direcaoY = personagemNoMapa.velocidade

        if (eventoTeclado.key === 'Enter') {
            // Verifica se o herói está em cima de uma fase para entrar
            let centroDaImagemHeroiX = personagemNoMapa.posicaoX + personagemNoMapa.largura / 2
            let centroDaImagemHeroiY = personagemNoMapa.posicaoY + personagemNoMapa.altura / 2
            let identificadorDaFaseNoPonto = verificarQualFaseEstaNoPonto(centroDaImagemHeroiX, centroDaImagemHeroiY)

            if (identificadorDaFaseNoPonto >= 0) {
                const faseEstaLiberadaParaJogar = identificadorDaFaseNoPonto === 0 || fasesJaCompletadas[identificadorDaFaseNoPonto - 1]
                if (faseEstaLiberadaParaJogar) {
                    iniciarNivelDoJogo(identificadorDaFaseNoPonto)
                }
            }
        }
    }
    else if (estadoAtualDoJogo === ESTADOS_DO_JOGO.JOGANDO) {
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') navePrincipalDoJogador.direcaoDeMovimento = -5
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') navePrincipalDoJogador.direcaoDeMovimento = 5
    }
    else if (estadoAtualDoJogo === ESTADOS_DO_JOGO.RESULTADO) {
        if (eventoTeclado.key === 'Enter') {
            estadoAtualDoJogo = ESTADOS_DO_JOGO.MAPA
        }
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (estadoAtualDoJogo === ESTADOS_DO_JOGO.MAPA) {
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') if (personagemNoMapa.direcaoX < 0) personagemNoMapa.direcaoX = 0
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') if (personagemNoMapa.direcaoX > 0) personagemNoMapa.direcaoX = 0
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') if (personagemNoMapa.direcaoY < 0) personagemNoMapa.direcaoY = 0
        if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') if (personagemNoMapa.direcaoY > 0) personagemNoMapa.direcaoY = 0
    }
    else if (estadoAtualDoJogo === ESTADOS_DO_JOGO.JOGANDO) {
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') navePrincipalDoJogador.direcaoDeMovimento = 0
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') navePrincipalDoJogador.direcaoDeMovimento = 0
    }
})

document.addEventListener('keypress', (eventoTeclado) => {
    if (estadoAtualDoJogo !== ESTADOS_DO_JOGO.JOGANDO) return
    if (eventoTeclado.key === 'l' || eventoTeclado.key === 'z') {
        listaDeTirosDisparados.push(new Tiro(navePrincipalDoJogador.posicaoX - 4 + navePrincipalDoJogador.largura / 2, navePrincipalDoJogador.posicaoY, 8, 16, 'red'))
    }
})

// ─── Integração Mouse Removida ─────────────────

// ─── Lógica ──────────────────────────────────
function iniciarNivelDoJogo(indiceDaFaseEscolhida) {
    indiceDaFaseSelecionada = indiceDaFaseEscolhida
    configuracaoDaFaseAtual = fasesDoJogo[indiceDaFaseEscolhida]

    // Reset da nave e dos grupos
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
    estadoAtualDoJogo = ESTADOS_DO_JOGO.JOGANDO

    // Tenta tocar a música (pode falhar se o navegador bloquear autoplay)
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
    contexto.fillText('Aperte Enter para voltar ao mapa', 400, 320)
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
    // Mostra Pontos/Alvo da fase
    textoComValorDePontos.desenharTexto(`${navePrincipalDoJogador.pontos}/${configuracaoDaFaseAtual.pontosParaVencer}`, 130, 40, 'white', '30px Georgia')
    textoFixoDeVidas.desenharTexto('Vidas:', 640, 40, 'white', '30px Georgia')
    textoComValorDeVidas.desenharTexto(navePrincipalDoJogador.vida, 740, 40, 'white', '30px Georgia')
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

    // Condição de Derrota ou Vitória
    if (navePrincipalDoJogador.vida <= 0) {
        mensagemFinalDeResultado = 'DERROTA!'
        estadoAtualDoJogo = ESTADOS_DO_JOGO.RESULTADO
        audioMotorDaNave.pause()
    } else if (navePrincipalDoJogador.pontos >= configuracaoDaFaseAtual.pontosParaVencer) {
        mensagemFinalDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[indiceDaFaseSelecionada] = true // Desbloqueia próxima fase
        estadoAtualDoJogo = ESTADOS_DO_JOGO.RESULTADO
        audioMotorDaNave.pause()
    }
}

// ─── Loop Principal ──────────────────────────
function rodarTickDoJogoPrincipal() {
    contexto.clearRect(0, 0, 800, 560)

    if (estadoAtualDoJogo === ESTADOS_DO_JOGO.MAPA) {
        desenha_mapa()
        personagemNoMapa.mover() // Movimenta o herói
        personagemNoMapa.desenharObjeto() // Desenha o herói em cima do mapa
    }
    else if (estadoAtualDoJogo === ESTADOS_DO_JOGO.JOGANDO) {
        desenharGraficosDoNivel()
        atualizarCalculosDoNivel()
    }
    else if (estadoAtualDoJogo === ESTADOS_DO_JOGO.RESULTADO) {
        desenharGraficosDoNivel() // Mantém o jogo de fundo
        desenharTelaDeVitoriaOuDerrota() // Desenha tela de vitória/derrota por cima
    }

    requestAnimationFrame(rodarTickDoJogoPrincipal)
}

rodarTickDoJogoPrincipal()