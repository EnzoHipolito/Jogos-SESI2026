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
let fundoDoCenario = new Fundo(0, 0, 1024, 640, '../assets/backgroundFase2.png')

// ─── JOGADOR 1 (Bombhead) — WASD + Z/L para atirar ───
let naveDoJogador = new PersonagemAnimado(20, 0, 100, 120, '../assets/Bombhead/', '9.png', ['10.png', '11.png', '12.png', '13.png']) // Bombhead (9-13)

// ─── JOGADOR 2 (Bombhat) — Setinhas + Enter para atirar ───
let naveDoJogador2 = new PersonagemAnimado(250, 0, 100, 120, '../assets/Bombhat/') // Bombhat (14-18)

// Aumenta o pulo apenas para a Fase 2, para alcançarem as nuvens
naveDoJogador.forcaDoPulo = -16;
naveDoJogador2.forcaDoPulo = -16;
naveDoJogador.temChao = false;
naveDoJogador2.temChao = false;

// Plataformas (Nuvens) mapeadas do backgroundFase2.png
let nuvensDaFase = [
    new Plataforma(0, 143, 128, 20),    // Topo Esquerda
    new Plataforma(397, 246, 128, 20),  // Perto do topo da torre (Esquerda)
    new Plataforma(218, 337, 128, 20),  // Meio Esquerda
    new Plataforma(307, 531, 141, 20),  // Baixo Esquerda
    new Plataforma(621, 337, 128, 20),  // Meio Direita
    new Plataforma(794, 520, 128, 20),  // Baixo Direita
    new Plataforma(922, 189, 102, 20)    // Topo Direita
]

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

// ─── Boss da Fase (inimigo único) ─────────────
let bossDaFase = {
    posicaoX: 620,
    posicaoY: 200,
    largura: 250,
    altura: 250,
    imagemSrc: '../assets/vilao_nuvem/vilao_nuvem1.png',
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
        if (this.posicaoY >= 640 - this.altura - 10) {
            this.posicaoY = 640 - this.altura - 10
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
            criarTiroAleatorioDoBoss(this, '../assets/tiro_aviao_aviao/tiroaviao02.png', 80, 80).forEach((tiroCriado) => listaDeTirosDoBoss.push(tiroCriado))
        }
    }
}

// Cooldown para evitar que encostar no boss tire todas as vidas de uma vez
let cooldownDeColisao = 0
let cooldownDeColisaoJ2 = 0

document.addEventListener('keydown', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        // ─── Controles Jogador 1 (WASD + Z/L) ───
        // Movimento horizontal
        if (eventoTeclado.key === 'a') naveDoJogador.velocidadeX = -naveDoJogador.velocidadeMovimento
        if (eventoTeclado.key === 'd') naveDoJogador.velocidadeX = naveDoJogador.velocidadeMovimento
        // Pulo
        if (eventoTeclado.key === 'w') {
            eventoTeclado.preventDefault()
            naveDoJogador.pular()
        }
        // Disparo J1
        if (eventoTeclado.key === 'z' || eventoTeclado.key === 'l' || eventoTeclado.key === ' ') {
            listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 10, 100, 50, '../assets/tiro_aviao_aviao/tiroaviao01.png'))
        }

        // ─── Controles Jogador 2 (Setinhas + Enter) ───
        // Movimento horizontal
        if (eventoTeclado.key === 'ArrowLeft') naveDoJogador2.velocidadeX = -naveDoJogador2.velocidadeMovimento
        if (eventoTeclado.key === 'ArrowRight') naveDoJogador2.velocidadeX = naveDoJogador2.velocidadeMovimento
        // Pulo
        if (eventoTeclado.key === 'ArrowUp') {
            eventoTeclado.preventDefault()
            naveDoJogador2.pular()
        }
        // Disparo J2
        if (eventoTeclado.key === 'Enter') {
            listaDeTirosDisparadosJ2.push(new Tiro(naveDoJogador2.posicaoX + naveDoJogador2.largura, naveDoJogador2.posicaoY + naveDoJogador2.altura / 2 - 10, 100, 50, '../assets/tiro_aviao_aviao/tiroaviao01.png'))
        }
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
        // Para movimento horizontal ao soltar a tecla — Jogador 1
        if (eventoTeclado.key === 'a') naveDoJogador.velocidadeX = 0
        if (eventoTeclado.key === 'd') naveDoJogador.velocidadeX = 0
        // Para movimento horizontal ao soltar a tecla — Jogador 2
        if (eventoTeclado.key === 'ArrowLeft') naveDoJogador2.velocidadeX = 0
        if (eventoTeclado.key === 'ArrowRight') naveDoJogador2.velocidadeX = 0
    }
})

function iniciarFase() {
    // Jogador 1
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador.posicaoX = 50
    naveDoJogador.posicaoY = 245
    naveDoJogador.velocidadeX = 0
    naveDoJogador.velocidadeY = 0
    naveDoJogador.noChao = false

    // Jogador 2
    naveDoJogador2.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador2.posicaoX = 50
    naveDoJogador2.posicaoY = 345
    naveDoJogador2.velocidadeX = 0
    naveDoJogador2.velocidadeY = 0
    naveDoJogador2.noChao = false

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
    contexto.fillStyle = 'white'
    contexto.textAlign = 'center'
    contexto.font = 'bold 50px Arial'
    contexto.fillText(mensagemDeResultado, 512, 300)
    contexto.font = '20px Arial'
    contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 512, 360)
}

function desenharGraficosDoNivel() {
    fundoDoCenario.desenharObjeto()
    nuvensDaFase.forEach(nuvem => nuvem.desenharObjeto())

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
    if (naveDoJogador.vida > 0) naveDoJogador.mover(nuvensDaFase)
    if (naveDoJogador2.vida > 0) naveDoJogador2.mover(nuvensDaFase)

    // Lógica de morte ao cair das nuvens
    if (naveDoJogador.posicaoY > 640 && naveDoJogador.vida > 0) {
        naveDoJogador.vida -= 1;
        if (naveDoJogador.vida > 0) {
            naveDoJogador.posicaoX = 20;
            naveDoJogador.posicaoY = 0;
            naveDoJogador.velocidadeY = 0;
        }
    }
    if (naveDoJogador2.posicaoY > 640 && naveDoJogador2.vida > 0) {
        naveDoJogador2.vida -= 1;
        if (naveDoJogador2.vida > 0) {
            naveDoJogador2.posicaoX = 250;
            naveDoJogador2.posicaoY = 0;
            naveDoJogador2.velocidadeY = 0;
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
