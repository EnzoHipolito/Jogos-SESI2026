let contexto = document.getElementById('des').getContext('2d')
let elementoCanvas = document.getElementById('des')

// ─── Estados da Fase ─────────────────────────
const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemDeResultado = ''

// A variável global ID_DA_FASE deve vir do HTML (0, 1 ou 2)
let configuracaoDaFase = fasesDoJogo[ID_DA_FASE];

// ─── Vida máxima (para coletáveis de cura) ────────────────────────────────────
let vidaMaximaDoJogador = 0;

// ─── Objetos Básicos ─────────────────────────
let fundoDoCenario = new Fundo(0, 0, 1024, 640, '../assets/bacgroundFase1.png')

// ─── JOGADOR 1 (Bombhead) — WASD + Z/L/Espaço para atirar ───
let naveDoJogador = new PersonagemAnimado(50, 270, 100, 120, '../assets/bombhead_spritess/', 'bombhead_1.png', ['bombhead_2.png', 'bombhead_3.png', 'bombhead_4.png', 'bombhead_5.png'], 'bombhead_6.png')

// ─── JOGADOR 2 (Bombhat) — Setinhas + Enter para atirar ───
// Usa bombhat_spritess (na raiz): idle=01, run=02-04, tiro=05
let naveDoJogador2 = new PersonagemAnimado(50, 370, 100, 120, '../bombhat_spritess/', 'bombhat01.png', ['bombhat02.png', 'bombhat03.png', 'bombhat04.png'], 'bombhat05.png')

let textoFixoDeVidas = new Texto()
let textoComValorDeVidas = new Texto()
let textoFixoDeVidasJ2 = new Texto()
let textoComValorDeVidasJ2 = new Texto()
let textoFixoDePontos = new Texto()
let textoComValorDePontos = new Texto()

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
    imagemSrc: '../assets/vilao_carta/vilao_carta_01.png',
    imagemTiro: '../assets/vilao_carta/vilao_carta_02.png',
    tempoTiro: 0,
    direcaoVertical: 1,
    velocidade: 1.5,
    vidaDoBoss: 0,
    vidaMaximaDoBoss: 0,
    contadorDeTiro: 0,

    iniciar() {
        this.posicaoX = 720
        this.posicaoY = 200
        this.direcaoVertical = 1
        this.vidaMaximaDoBoss = 20
        this.vidaDoBoss = this.vidaMaximaDoBoss
        this.contadorDeTiro = 0
        this.tempoTiro = 0
    },

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

    /**
     * Verifica se o boss colidiu com outro objeto (nave ou tiro).
     */
    colidiuCom(outroObjeto) {
        return verificarColisao(this, outroObjeto)
    },

    /**
     * O boss atira um TiroBoss em direção à nave do jogador periodicamente.
     */
    atirar() {
        this.contadorDeTiro += 1
        if (this.contadorDeTiro >= configuracaoDaFase.taxaDeCriacao[0]) {
            this.contadorDeTiro = 0
            this.tempoTiro = 20;
            SoundManager.tocarSomTiroBoss()
            criarTiroAleatorioDoBoss(this, '../assets/carta/carta_01.png', 80, 100).forEach((tiroCriado) => listaDeTirosDoBoss.push(tiroCriado))
        }
    }
}

// Cooldown para evitar que encostar no boss tire todas as vidas de uma vez
let cooldownDeColisao = 0
let cooldownDeColisaoJ2 = 0

document.addEventListener('keydown', (eventoTeclado) => {
    SoundManager.inicializar()
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        // ─── Controles Jogador 1 (WASD + Z/L/Espaço) ───
        if (eventoTeclado.key === 'a')  naveDoJogador.velocidadeX = -naveDoJogador.velocidadeMovimento
        if (eventoTeclado.key === 'd') naveDoJogador.velocidadeX =  naveDoJogador.velocidadeMovimento
        if (eventoTeclado.key === 'w') {
            eventoTeclado.preventDefault()
            const noChaoAntes = naveDoJogador.noChao
            naveDoJogador.pular()
            if (noChaoAntes) SoundManager.tocarSomPulo()
        }
        if (eventoTeclado.key === 'g' || eventoTeclado.key === 'G') {
            if (naveDoJogador.cooldownTiro <= 0) {
                listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura / 2 + 10, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 10, 120, 60, '../assets/tiros_personagens/tiros_personagens.png'))
                naveDoJogador.cooldownTiro = 15;
                SoundManager.tocarSomTiro()
            }
        }

        // ─── Controles Jogador 2 (Setinhas + Enter) ───
        if (eventoTeclado.key === 'ArrowLeft')  naveDoJogador2.velocidadeX = -naveDoJogador2.velocidadeMovimento
        if (eventoTeclado.key === 'ArrowRight') naveDoJogador2.velocidadeX =  naveDoJogador2.velocidadeMovimento
        if (eventoTeclado.key === 'ArrowUp') {
            eventoTeclado.preventDefault()
            const noChaoAntesJ2 = naveDoJogador2.noChao
            naveDoJogador2.pular()
            if (noChaoAntesJ2) SoundManager.tocarSomPulo()
        }
        // Disparo J2 — corrigido: adiciona em listaDeTirosDisparadosJ2
        if (eventoTeclado.key === 'Enter') {
            if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO && naveDoJogador2.cooldownTiro <= 0) {
                listaDeTirosDisparadosJ2.push(new Tiro(naveDoJogador2.posicaoX + naveDoJogador2.largura / 2 + 10, naveDoJogador2.posicaoY + naveDoJogador2.altura / 2 - 10, 120, 60, '../assets/tiros_personagens/tiros_personagens.png'))
                naveDoJogador2.cooldownTiro = 15;
                SoundManager.tocarSomTiro()
            }
        }
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        if (eventoTeclado.key === 'Enter') {
            window.location.href = "mapa_2p.html"
        }
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        if (eventoTeclado.key === 'a')  naveDoJogador.velocidadeX = 0
        if (eventoTeclado.key === 'd') naveDoJogador.velocidadeX = 0
        if (eventoTeclado.key === 'ArrowLeft')  naveDoJogador2.velocidadeX = 0
        if (eventoTeclado.key === 'ArrowRight') naveDoJogador2.velocidadeX = 0
    }

    if (eventoTeclado.key === 'Escape') {
        if (!window.saindo) {
            window.saindo = true;
            window.location.href = "mapa.html"
        }
    }
})

function iniciarFase() {
    // Jogador 1
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    vidaMaximaDoJogador = configuracaoDaFase.vidasDaFase
    naveDoJogador.pontos = 0
    naveDoJogador.posicaoX = 50
    naveDoJogador.posicaoY = 245
    naveDoJogador.velocidadeX = 0
    naveDoJogador.velocidadeY = 0
    naveDoJogador.noChao = false

    // Jogador 2
    naveDoJogador2.vida = configuracaoDaFase.vidasDaFase
    naveDoJogador2.pontos = 0
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
    inicializarColetaveis({
        MARGEM_X_MIN: 50,
        MARGEM_X_MAX: 570,
        MARGEM_Y_MIN: 260,
        MARGEM_Y_MAX: 350,
        INTERVALO_MIN: 180,
        INTERVALO_MAX: 280,
    })
    SoundManager.resetarResultado()

    elementoCanvas.style.cursor = 'default'
    estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
}

/**
 * Verifica se a nave do jogador 1 encostou no boss.
 * Usa um cooldown para não descontar vida continuamente.
 */
function conferirBatidaDaNaveComBoss() {
    if (cooldownDeColisao > 0) {
        cooldownDeColisao -= 1
        return
    }
    if (naveDoJogador.vida > 0 && bossDaFase.colidiuCom(naveDoJogador)) {
        naveDoJogador.vida -= 1
        cooldownDeColisao = 60
        SoundManager.tocarSomDano()
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
        SoundManager.tocarSomDano()
    }
}

/**
 * Verifica se algum tiro do jogador 1 acertou o boss.
 */
function conferirTirosNoBoss() {
    listaDeTirosDisparados.forEach((tiroDisparadoAgora) => {
        if (bossDaFase.colidiuCom(tiroDisparadoAgora)) {
            listaDeTirosDisparados.splice(listaDeTirosDisparados.indexOf(tiroDisparadoAgora), 1)
            bossDaFase.vidaDoBoss -= 1
            SoundManager.tocarSomImpacto()
        }
    })
    // Tiros do jogador 2
    listaDeTirosDisparadosJ2.forEach((tiroDisparadoAgora) => {
        if (bossDaFase.colidiuCom(tiroDisparadoAgora)) {
            listaDeTirosDisparadosJ2.splice(listaDeTirosDisparadosJ2.indexOf(tiroDisparadoAgora), 1)
            bossDaFase.vidaDoBoss -= 1
            SoundManager.tocarSomImpacto()
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
            SoundManager.tocarSomDano()
            return
        }
        if (naveDoJogador2.vida > 0 && naveDoJogador2.colidiuCom(tiro)) {
            listaDeTirosDoBoss.splice(listaDeTirosDoBoss.indexOf(tiro), 1)
            naveDoJogador2.vida -= tiro.dano
            SoundManager.tocarSomDano()
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
        contexto.font = 'bold 22px Arial'
        contexto.fillStyle = '#FFD700'
        contexto.fillText('Pontuação J1: ' + naveDoJogador.pontos + ' pts  |  J2: ' + naveDoJogador2.pontos + ' pts', 512, 510)
    } else {
        contexto.fillStyle = 'white'
        contexto.textAlign = 'center'
        contexto.font = 'bold 50px Arial'
        contexto.fillText(mensagemDeResultado, 512, 300)
        contexto.font = '20px Arial'
        contexto.fillText('Aperte Enter ou ESC para voltar ao mapa', 512, 360)
        contexto.font = 'bold 20px Arial'
        contexto.fillStyle = '#FFD700'
        contexto.fillText('Pontuação J1: ' + naveDoJogador.pontos + ' pts  |  J2: ' + naveDoJogador2.pontos + ' pts', 512, 400)
    }
}

function desenharGraficosDoNivel() {
    fundoDoCenario.desenharObjeto()

    if (naveDoJogador.vida > 0) naveDoJogador.desenharObjeto()
    if (naveDoJogador2.vida > 0) naveDoJogador2.desenharObjeto()

    gerenciadorDeTiros.desenharNaTela()
    listaDeTirosDoBoss.forEach((tiro) => tiro.desenharTiro())
    bossDaFase.desenharObjeto()
    desenharColetaveis(contexto)

    // HUD Jogador 1
    textoFixoDeVidas.desenharTexto('J1 Vidas:', 10, 40, '#00eeff', '20px Georgia')
    textoComValorDeVidas.desenharTexto(naveDoJogador.vida, 120, 40, 'red', '20px Georgia')

    // HUD Jogador 2
    textoFixoDeVidasJ2.desenharTexto('J2 Vidas:', 10, 70, '#ffaa00', '20px Georgia')
    textoComValorDeVidasJ2.desenharTexto(naveDoJogador2.vida, 120, 70, 'red', '20px Georgia')

    // Pontos (soma dos dois jogadores)
    textoFixoDePontos.desenharTexto('Pontos:', 10, 100, 'white', '18px Georgia')
    textoComValorDePontos.desenharTexto('J1:' + naveDoJogador.pontos + ' J2:' + naveDoJogador2.pontos, 95, 100, '#FFD700', '18px Georgia')

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

    // Coletáveis — ambos jogadores podem coletar (usa J1 como referência, checa J2 manualmente)
    atualizarColetaveis(naveDoJogador, vidaMaximaDoJogador)
    // Coletáveis para o J2 (verifica manualmente pois atualizarColetaveis só aceita uma nave)
    for (let i = listaDeColetaveis.length - 1; i >= 0; i--) {
        const col = listaDeColetaveis[i]
        if (col.colidiuComNave(naveDoJogador2)) {
            if (col.tipo === 'pontos') {
                naveDoJogador2.pontos = (naveDoJogador2.pontos || 0) + 50
                SoundManager.tocarSomColetavel()
            } else {
                if (naveDoJogador2.vida < vidaMaximaDoJogador) naveDoJogador2.vida++
                SoundManager.tocarSomVida()
            }
            listaDeColetaveis.splice(i, 1)
        }
    }

    conferirTirosNoBoss()
    conferirBatidaDaNaveComBoss()
    conferirBatidaDaNaveComBossJ2()
    conferirTirosDoBossNaNave()

    if (naveDoJogador.vida <= 0 && naveDoJogador2.vida <= 0) {
        mensagemDeResultado = 'DERROTA!'
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        SoundManager.tocarSomDerrota()
    } else if (bossDaFase.vidaDoBoss <= 0) {
        mensagemDeResultado = 'VITÓRIA!'
        fasesJaCompletadas[ID_DA_FASE] = true
        salvarProgresso()
        estadoAtualDaFase = ESTADOS_DA_FASE.RESULTADO
        SoundManager.tocarSomVitoria()
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
