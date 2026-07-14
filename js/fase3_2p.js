let contexto = document.getElementById('des').getContext('2d')
let elementoCanvasDoJogo = document.getElementById('des')

const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemDeResultado = ''

let configuracaoDaFase = fasesDoJogo[ID_DA_FASE];

let fundoDoCenario = new Fundo(0, 0, 1024, 640, '../assets/backgroundFase3.png')

// ─── JOGADOR 1 (Bombhead) — WASD + Z/L para atirar ───
let naveDoJogador = new Nave(50, 200, 180, 110, '../assets/aviao_bombhead/bombhead_aviao.png') // Avião P1

// ─── JOGADOR 2 (Bombhat) — Setinhas + Enter para atirar ───
let naveDoJogador2 = new Nave(50, 350, 180, 110, '../assets/aviao_bombhead/bombhat_aviao.png') // Avião P2

let textoFixoDeVidas = new Texto()
let textoComValorDeVidas = new Texto()
let textoFixoDeVidasJ2 = new Texto()
let textoComValorDeVidasJ2 = new Texto()

// ─── Tiros do Jogador 1 ───
let listaDeTirosDisparados = []
// ─── Tiros do Jogador 2 ───
let listaDeTirosDisparadosJ2 = []
let listaDeTirosDoBoss = []

let gerenciadorDeTiros = {
    desenharNaTela() {
        listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
            tiroDisparadoAgora.desenharTiro()
        })
        listaDeTirosDisparadosJ2.forEach((tiroDisparadoAgora) => {
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
        listaDeTirosDisparadosJ2.forEach((tiroDisparadoAgora) => {
            tiroDisparadoAgora.mover()
            if (tiroDisparadoAgora.posicaoX >= 810) {
                listaDeTirosDisparadosJ2.splice(listaDeTirosDisparadosJ2.indexOf(tiroDisparadoAgora), 1)
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
        this.posicaoX = 620
        this.posicaoY = 200
        this.direcaoVertical = 1
        this.vidaMaximaDoBoss = 25
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
            criarTiroAleatorioDoBoss(this, '../assets/tiro_aviao_aviao/tiroaviao03.png', 100, 50, true).forEach((tiroCriado) => listaDeTirosDoBoss.push(tiroCriado))
        }
    }
}

let cooldownDeColisao = 0
let cooldownDeColisaoJ2 = 0

document.addEventListener('keydown', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        // ─── Controles Jogador 1 (WASD) ───
        if (eventoTeclado.key === 'w') naveDoJogador.direcaoDeMovimento = -5
        if (eventoTeclado.key === 's') naveDoJogador.direcaoDeMovimento = 5

        // ─── Controles Jogador 2 (Setinhas) ───
        if (eventoTeclado.key === 'ArrowUp') naveDoJogador2.direcaoDeMovimento = -5
        if (eventoTeclado.key === 'ArrowDown') naveDoJogador2.direcaoDeMovimento = 5
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        if (eventoTeclado.key === 'Enter') {
            window.location.href = "mapa_2p.html"
        }
    }

    if (eventoTeclado.key === 'Escape') {
        window.location.href = "mapa_2p.html"
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        // Jogador 1
        if (eventoTeclado.key === 'w') naveDoJogador.direcaoDeMovimento = 0
        if (eventoTeclado.key === 's') naveDoJogador.direcaoDeMovimento = 0
        // Jogador 2
        if (eventoTeclado.key === 'ArrowUp') naveDoJogador2.direcaoDeMovimento = 0
        if (eventoTeclado.key === 'ArrowDown') naveDoJogador2.direcaoDeMovimento = 0
    }
})

document.addEventListener('keypress', (eventoTeclado) => {
    if (estadoAtualDaFase !== ESTADOS_DA_FASE.JOGANDO) return
    
    // Tiro Jogador 1 (L ou Z)
    if (eventoTeclado.key === 'l' || eventoTeclado.key === 'z') {
        if (naveDoJogador.cooldownTiro <= 0) {
            listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 10, 100, 50, '../assets/tiro_aviao_aviao/tiroaviao01.png'))
            naveDoJogador.cooldownTiro = 15;
        }
    }

    // Tiro Jogador 2 (Enter ou E)
    if (eventoTeclado.key === 'Enter' || eventoTeclado.key === 'e') {
        if (naveDoJogador2.cooldownTiro <= 0) {
            listaDeTirosDisparadosJ2.push(new Tiro(naveDoJogador2.posicaoX + naveDoJogador2.largura, naveDoJogador2.posicaoY + naveDoJogador2.altura / 2 - 10, 100, 50, '../assets/tiro_aviao_aviao/tiroaviao01.png'))
            naveDoJogador2.cooldownTiro = 15;
        }
    }
})

function iniciarFase() {
    // Jogador 1
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador.posicaoX = 50
    naveDoJogador.posicaoY = 245
    naveDoJogador.direcaoDeMovimento = 0

    // Jogador 2
    naveDoJogador2.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador2.posicaoX = 50
    naveDoJogador2.posicaoY = 345
    naveDoJogador2.direcaoDeMovimento = 0

    listaDeTirosDisparados = []
    listaDeTirosDisparadosJ2 = []
    listaDeTirosDoBoss = []
    bossDaFase.iniciar()
    cooldownDeColisao = 0
    cooldownDeColisaoJ2 = 0

    elementoCanvasDoJogo.style.cursor = 'default'
    estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO

}

/**
 * Verifica se a nave do jogador 1 encostou no boss.
 */
function conferirBatidaDaNaveComBoss() {
    if (cooldownDeColisao > 0) {
        cooldownDeColisao -= 1
        return
    }
    if (naveDoJogador.vida > 0 && bossDaFase.colidiuCom(naveDoJogador)) {
        naveDoJogador.vida -= 1
        cooldownDeColisao = 60
    }
}

/**
 * Verifica se a nave do jogador 2 encostou no boss.
 */
function conferirBatidaDaNaveComBossJ2() {
    if (cooldownDeColisaoJ2 > 0) {
        cooldownDeColisaoJ2 -= 1
        return
    }
    if (naveDoJogador2.vida > 0 && bossDaFase.colidiuCom(naveDoJogador2)) {
        naveDoJogador2.vida -= 1
        cooldownDeColisaoJ2 = 60
    }
}

/**
 * Verifica se algum tiro acertou o boss.
 */
function conferirTirosNoBoss() {
    listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
        if (bossDaFase.colidiuCom(tiroDisparadoAgora)) {
            listaDeTirosDisparados.splice(listaDeTirosDisparados.indexOf(tiroDisparadoAgora), 1)
            bossDaFase.vidaDoBoss -= 1
        }
    })
    listaDeTirosDisparadosJ2.forEach((tiroDisparadoAgora) => {
        if (bossDaFase.colidiuCom(tiroDisparadoAgora)) {
            listaDeTirosDisparadosJ2.splice(listaDeTirosDisparadosJ2.indexOf(tiroDisparadoAgora), 1)
            bossDaFase.vidaDoBoss -= 1
        }
    })
}

/**
 * Verifica se os tiros disparados pelo boss acertaram as naves.
 */
function conferirTirosDoBossNaNave() {
    listaDeTirosDoBoss.forEach((tiro) => {
        if (naveDoJogador.vida > 0 && naveDoJogador.colidiuCom(tiro)) {
            listaDeTirosDoBoss.splice(listaDeTirosDoBoss.indexOf(tiro), 1)
            naveDoJogador.vida -= tiro.dano
            return
        }
        if (naveDoJogador2.vida > 0 && naveDoJogador2.colidiuCom(tiro)) {
            listaDeTirosDoBoss.splice(listaDeTirosDoBoss.indexOf(tiro), 1)
            naveDoJogador2.vida -= tiro.dano
        }
    })
}

/**
 * Exibe a tela de resultado no fim da fase (Vitória ou Derrota).
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
    } else {
        contexto.fillStyle = 'white'
        contexto.textAlign = 'center'
        contexto.font = 'bold 50px Arial'
        contexto.fillText(mensagemDeResultado, 512, 300)
        contexto.font = '20px Arial'
        contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 512, 360)
    }
}

function desenharGraficosDoNivel() {
    fundoDoCenario.desenharObjeto()

    if (naveDoJogador.vida > 0) naveDoJogador.desenharObjeto()
    if (naveDoJogador2.vida > 0) naveDoJogador2.desenharObjeto()

    gerenciadorDeTiros.desenharNaTela()
    listaDeTirosDoBoss.forEach((tiro) => tiro.desenharTiro())
    bossDaFase.desenharObjeto()

    // HUD Jogador 1
    textoFixoDeVidas.desenharTexto('J1 Vidas:', 10, 40, '#00eeff', '20px Georgia')
    textoComValorDeVidas.desenharTexto(naveDoJogador.vida, 120, 40, 'red', '20px Georgia')

    // HUD Jogador 2
    textoFixoDeVidasJ2.desenharTexto('J2 Vidas:', 10, 70, '#ffaa00', '20px Georgia')
    textoComValorDeVidasJ2.desenharTexto(naveDoJogador2.vida, 120, 70, 'red', '20px Georgia')

    // Instrução ESC
    contexto.textAlign = 'center'
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Mapa', 512, 620)

    // Indicador 2P
    contexto.textAlign = 'right'
    contexto.font = 'bold 14px Arial'
    contexto.fillStyle = '#00eeff'
    contexto.fillText('2 JOGADORES', 790, 20)
}

function atualizarCalculosDoNivel() {
    if (naveDoJogador.cooldownTiro > 0) naveDoJogador.cooldownTiro--
    if (naveDoJogador2.cooldownTiro > 0) naveDoJogador2.cooldownTiro--
    if (naveDoJogador.vida > 0) naveDoJogador.mover()
    if (naveDoJogador2.vida > 0) naveDoJogador2.mover()

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
    conferirBatidaDaNaveComBossJ2()
    conferirTirosDoBossNaNave()

    if (naveDoJogador.vida <= 0 && naveDoJogador2.vida <= 0) {
        mensagemDeResultado = 'DERROTA!'
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
    } else if (bossDaFase.vidaDoBoss == 0) {
        mensagemDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[ID_DA_FASE] = true
        salvarProgresso()
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
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
        desenharGraficosDoNivel()
        desenharTelaDeVitoriaOuDerrota()
    }

    requestAnimationFrame(principal)
}

iniciarFase()
principal()
