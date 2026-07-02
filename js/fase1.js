let contexto = document.getElementById('des').getContext('2d')
let elementoCanvas = document.getElementById('des')

// ─── Estados da Fase ─────────────────────────
const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemDeResultado = ''

// A variável global ID_DA_FASE deve vir do HTML (0, 1 ou 2)
let configuracaoDaFase = fasesDoJogo[ID_DA_FASE];

// ─── Objetos Básicos ─────────────────────────
// Utilizando um background estático que não se repete
let fundoDoCenario = new Fundo(0, 0, 800, 560, 'assets/bacgroundFase1.png')
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

let listaDeDiscosInimigos = []
let gerenciadorDeDiscos = {
    contadorTempoInimigo1: 0,
    contadorTempoInimigo2: 0,
    contadorTempoInimigo3: 0,

    criarInimigosNovos() {
        if (!configuracaoDaFase) return; // Só cria se tiver fase ativa
        this.contadorTempoInimigo1 += 1
        this.contadorTempoInimigo2 += 1
        this.contadorTempoInimigo3 += 1
        let posicaoAleatoriaY1 = (Math.random() * (510 - 2 + 1) + 2)
        let posicaoAleatoriaY2 = (Math.random() * (510 - 2 + 1) + 2)
        let posicaoAleatoriaY3 = (Math.random() * (510 - 2 + 1) + 2)

        // Pega as velocidades da fase
        let velocidadeMinima = configuracaoDaFase.velocidadeDosInimigos[0]
        let velocidadeMaxima = configuracaoDaFase.velocidadeDosInimigos[1]
        let calculaSorteioVelocidade = () => Math.random() * (velocidadeMaxima - velocidadeMinima) + velocidadeMinima

        if (this.contadorTempoInimigo1 >= configuracaoDaFase.taxaDeCriacao[0]) {
            this.contadorTempoInimigo1 = 0
            listaDeDiscosInimigos.push(new Disco(850, posicaoAleatoriaY1, 50, 50, 'assets/disco.png', calculaSorteioVelocidade()))
        }
        if (this.contadorTempoInimigo2 >= configuracaoDaFase.taxaDeCriacao[1]) {
            this.contadorTempoInimigo2 = 0
            listaDeDiscosInimigos.push(new Disco(900, posicaoAleatoriaY2, 50, 50, 'assets/disco2.png', calculaSorteioVelocidade()))
        }
        if (this.contadorTempoInimigo3 >= configuracaoDaFase.taxaDeCriacao[2]) {
            this.contadorTempoInimigo3 = 0
            listaDeDiscosInimigos.push(new Disco(950, posicaoAleatoriaY3, 50, 50, 'assets/disco3.png', calculaSorteioVelocidade()))
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
                    naveDoJogador.pontos += 1
                }
            })
        })
    },
    atualizarPosicoes() {
        this.criarInimigosNovos()
        this.destruirSeAcertouTiro()
        listaDeDiscosInimigos.forEach((discoInimigoAparecendo) => {
            discoInimigoAparecendo.mover()
            if (discoInimigoAparecendo.posicaoX <= -60) {
                listaDeDiscosInimigos.splice(listaDeDiscosInimigos.indexOf(discoInimigoAparecendo), 1)
            }
        })
    }
}

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
    listaDeDiscosInimigos = []
    gerenciadorDeDiscos.contadorTempoInimigo1 = 0
    gerenciadorDeDiscos.contadorTempoInimigo2 = 0
    gerenciadorDeDiscos.contadorTempoInimigo3 = 0

    elementoCanvas.style.cursor = 'default'
    estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO

    try { audioMotorDaNave.currentTime = 0; audioMotorDaNave.play().catch(() => { }) } catch (erroDoNavegador) { }
}

/**
 * Verifica se a nave do jogador colidiu com algum dos inimigos na tela.
 * Caso haja colisão, remove o inimigo e desconta 1 de vida do jogador.
 */
function conferirBatidaDaNaveComInimigos() {
    listaDeDiscosInimigos.forEach((discoInimigoAparecendo) => {
        if (naveDoJogador.colidiuCom(discoInimigoAparecendo)) {
            listaDeDiscosInimigos.splice(listaDeDiscosInimigos.indexOf(discoInimigoAparecendo), 1)
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
    gerenciadorDeDiscos.desenharNaTela()

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
    gerenciadorDeDiscos.atualizarPosicoes()
    conferirBatidaDaNaveComInimigos()

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
