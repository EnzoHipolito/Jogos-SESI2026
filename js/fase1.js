let contexto = document.getElementById('des').getContext('2d')
let elementoCanvas = document.getElementById('des')

// ─── Estados da Fase ─────────────────────────
const ESTADOS_DA_FASE = { JOGANDO: 'JOGANDO', RESULTADO: 'RESULTADO' }
let estadoAtualDaFase = ESTADOS_DA_FASE.JOGANDO
let mensagemDeResultado = ''

// A variável global ID_DA_FASE deve vir do HTML (0, 1 ou 2)
let configuracaoDaFase = fasesDoJogo[ID_DA_FASE];

// ─── Vida máxima do jogador (para limitar cura dos coletáveis) ────────────────
let vidaMaximaDoJogador = 0;

// ─── Objetos Básicos ─────────────────────────
// Utilizando um background estático que não se repete
let fundoDoCenario = new Fundo(0, 0, 1024, 640, '../assets/bacgroundFase1.png')
let naveDoJogador = new PersonagemAnimado(50, 270, 100, 120, '../assets/bombhead_spritess/', 'bombhead_1.png', ['bombhead_2.png', 'bombhead_3.png', 'bombhead_4.png', 'bombhead_5.png'], 'bombhead_6.png') // Bombhead sprites

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
        this.vidaMaximaDoBoss = 15
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

document.addEventListener('keydown', (eventoTeclado) => {
    SoundManager.inicializar() // garante AudioContext após interação do usuário
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        // Movimento horizontal
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft')  naveDoJogador.velocidadeX = -naveDoJogador.velocidadeMovimento
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') naveDoJogador.velocidadeX =  naveDoJogador.velocidadeMovimento
        // Pulo
        if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp' || eventoTeclado.key === ' ') {
            eventoTeclado.preventDefault()
            const estaNoChaoAntes = naveDoJogador.noChao
            naveDoJogador.pular()
            if (estaNoChaoAntes) SoundManager.tocarSomPulo()
        }
        // Disparo
        if (eventoTeclado.key === 'l' || eventoTeclado.key === 'z') {
            if (naveDoJogador.cooldownTiro <= 0) {
                listaDeTirosDisparados.push(new Tiro(naveDoJogador.posicaoX + naveDoJogador.largura / 2 + 10, naveDoJogador.posicaoY + naveDoJogador.altura / 2 - 10, 120, 60, '../assets/tiros_personagens/tiros_personagens.png'))
                naveDoJogador.cooldownTiro = 15;
                SoundManager.tocarSomTiro()
            }
        }
    }
    else if (estadoAtualDaFase === ESTADOS_DA_FASE.RESULTADO) {
        if (eventoTeclado.key === 'Enter') {
            window.location.href = "mapa.html"
        }
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (estadoAtualDaFase === ESTADOS_DA_FASE.JOGANDO) {
        // Para movimento horizontal ao soltar a tecla
        if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft')  naveDoJogador.velocidadeX = 0
        if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') naveDoJogador.velocidadeX = 0
    }

    if (eventoTeclado.key === 'Escape') {
        if (!window.saindo) {
            window.saindo = true;
            window.location.href = "mapa.html"
        }
    }
})

function iniciarFase() {
    naveDoJogador.vida = configuracaoDaFase.vidasDaFase
    vidaMaximaDoJogador = configuracaoDaFase.vidasDaFase
    naveDoJogador.pontos = 0
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
    // Config de coletáveis específica da fase 1:
    // - Y limitado à zona alcançável pelo pulo (chão em y=380, pulo máximo ~144px → alcança y≈236)
    // - Spawn mais frequente que o padrão
    inicializarColetaveis({
        MARGEM_X_MIN: 50,
        MARGEM_X_MAX: 570,
        MARGEM_Y_MIN: 260,   // bem dentro do alcance do pulo
        MARGEM_Y_MAX: 350,   // próximo ao chão, sempre acessível
        INTERVALO_MIN: 180,  // ~3s
        INTERVALO_MAX: 280,  // ~4.5s
    })
    SoundManager.resetarResultado()

    elementoCanvas.style.cursor = 'default'
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
        cooldownDeColisao = 60 // ~1 segundo de invencibilidade
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
