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
let fundoDoCenario = new Fundo(0, 0, 800, 560, '../assets/backgroundFase2.png')
let naveDoJogador = new PersonagemAnimado(180, 100, 100, 120, '../assets/Bombhead/', '9.png', ['10.png', '11.png', '12.png', '13.png']) // Bombhead sprites (9-13)
naveDoJogador.forcaDoPulo = -16; // Pulo maior para a Fase 2
naveDoJogador.temChao = false; // Se cair da nuvem, morre

// Plataformas (Nuvens) mapeadas do backgroundFase2.png
let nuvensDaFase = [
    new Plataforma(0, 125, 100, 20),    // Topo Esquerda
    new Plataforma(310, 215, 100, 20),  // Perto do topo da torre (Esquerda)
    new Plataforma(170, 295, 100, 20),  // Meio Esquerda
    new Plataforma(240, 472, 110, 20),  // Baixo Esquerda
    new Plataforma(530, 295, 100, 20),  // Meio Direita
    new Plataforma(620, 455, 100, 20),  // Baixo Direita
    new Plataforma(720, 165, 80, 20)    // Topo Direita
]

let textoFixoDeVidas = new Texto()
let textoComValorDeVidas = new Texto()
const audioMotorDaNave = new Audio('../assets/nave_som.mp3')
const audioDeColisao = new Audio('../assets/batida.mp3')
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
    imagemSrc: '../assets/disco2.png',
    direcaoVertical: 1,
    velocidade: 2.0,
    vidaDoBoss: 0,
    vidaMaximaDoBoss: 0,
    contadorDeTiro: 0,

    iniciar() {
        this.posicaoX = 620
        this.posicaoY = 200
        this.direcaoVertical = 1
        this.vidaMaximaDoBoss = 8
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
        // Movimento horizontal
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') naveDoJogador.velocidadeX = -naveDoJogador.velocidadeMovimento
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') naveDoJogador.velocidadeX = naveDoJogador.velocidadeMovimento
        // Pulo
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp' || eventoTeclado.key === ' ') {
            eventoTeclado.preventDefault()
            naveDoJogador.pular()
        }
        // Disparo
        if (eventoTeclado.key === 'l' || eventoTeclado.key === 'z') {
            listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 4, 16, 8, 'red'))
        }
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
        // Para movimento horizontal ao soltar a tecla
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') naveDoJogador.velocidadeX = 0
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') naveDoJogador.velocidadeX = 0
    }
})

function iniciarFase() {
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador.posicaoX = 50
    naveDoJogador.posicaoY = 245
    // Resetar física do personagem
    naveDoJogador.velocidadeX = 0
    naveDoJogador.velocidadeY = 0
    naveDoJogador.noChao = false
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

function desenharGraficosDoNivel() {
    fundoDoCenario.desenharObjeto()
    nuvensDaFase.forEach(nuvem => nuvem.desenharObjeto()) // Invisível, mas útil para debug
    naveDoJogador.desenharObjeto()
    gerenciadorDeTiros.desenharNaTela()
    listaDeTirosDoBoss.forEach((tiro) => tiro.desenharTiro())
    bossDaFase.desenharObjeto()

    textoFixoDeVidas.desenharTexto('Vidas:', 640, 40, 'white', '30px Georgia')
    textoComValorDeVidas.desenharTexto(naveDoJogador.vida, 740, 40, 'red', '30px Georgia')

    // Instrução ESC
    contexto.textAlign = 'center'
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Mapa', 400, 540)
}

function atualizarCalculosDoNivel() {
    naveDoJogador.mover(nuvensDaFase)

    // Se o jogador cair do mapa (passar do final da tela)
    if (naveDoJogador.posicaoY > 560 && naveDoJogador.vida > 0) {
        naveDoJogador.vida -= 1;
        if (naveDoJogador.vida > 0) {
            // Respawn
            naveDoJogador.posicaoX = 180;
            naveDoJogador.posicaoY = 100;
            naveDoJogador.velocidadeY = 0;
        }
    }

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
    } else if (bossDaFase.vidaDoBoss == 0) {
        mensagemDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[ID_DA_FASE] = true
        salvarProgresso() // Salva as fases destravadas no localStorage
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        audioMotorDaNave.pause()
    }
}

function principal() {
    contexto.clearRect(0, 0, 800, 560)

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
