let contexto = document.getElementById('des').getContext('2d')
let elementoCanvasDoJogo = document.getElementById('des')

let personagemNoMapa = new HeroiMapa(170, 260, 90, 70, '../assets/personagens_inicio.png')

document.addEventListener('keydown', (eventoTeclado) => {
    if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') personagemNoMapa.direcaoX = -personagemNoMapa.velocidade
    if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') personagemNoMapa.direcaoX = personagemNoMapa.velocidade
    if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') personagemNoMapa.direcaoY = -personagemNoMapa.velocidade
    if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') personagemNoMapa.direcaoY = personagemNoMapa.velocidade

    if (eventoTeclado.key === 'Enter') {
        let centroDaImagemHeroiX = personagemNoMapa.posicaoX + personagemNoMapa.largura / 2
        let centroDaImagemHeroiY = personagemNoMapa.posicaoY + personagemNoMapa.altura / 2
        let identificadorDaFaseNoPonto = verificarFase(centroDaImagemHeroiX, centroDaImagemHeroiY)
        
        if (identificadorDaFaseNoPonto >= 0) {
            const faseEstaLiberadaParaJogar = identificadorDaFaseNoPonto === 0 || fasesJaCompletadas[identificadorDaFaseNoPonto - 1]
            if (faseEstaLiberadaParaJogar) {
                // Redirecionar para o HTML da fase 2 jogadores
                window.location.href = "fase" + (identificadorDaFaseNoPonto + 1) + "_2p.html"
            }
        }
    }

    if (eventoTeclado.key === 'Escape') {
        window.location.href = "../index.html"
    }
})

document.addEventListener('keyup', (eventoTeclado) => {
    if (eventoTeclado.key === 'a' || eventoTeclado.key === 'ArrowLeft') if (personagemNoMapa.direcaoX < 0) personagemNoMapa.direcaoX = 0
    if (eventoTeclado.key === 'd' || eventoTeclado.key === 'ArrowRight') if (personagemNoMapa.direcaoX > 0) personagemNoMapa.direcaoX = 0
    if (eventoTeclado.key === 'w' || eventoTeclado.key === 'ArrowUp') if (personagemNoMapa.direcaoY < 0) personagemNoMapa.direcaoY = 0
    if (eventoTeclado.key === 's' || eventoTeclado.key === 'ArrowDown') if (personagemNoMapa.direcaoY > 0) personagemNoMapa.direcaoY = 0
})

function principal() {
    contexto.clearRect(0, 0, 1024, 640)
    desenharMapa()
    personagemNoMapa.mover()
    personagemNoMapa.desenharObjeto()

    // Indicador de modo 2 jogadores
    contexto.textAlign = 'center'
    contexto.font = 'bold 16px Arial'
    contexto.fillStyle = '#00eeff'
    contexto.fillText('MODO 2 JOGADORES', 400, 70)

    requestAnimationFrame(principal)
}

principal()
