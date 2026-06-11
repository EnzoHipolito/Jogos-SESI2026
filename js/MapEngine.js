// ─── Dados das 3 fases ───────────────────────
const fasesDoJogo = [
    { idFase: 0, posicaoX: 200, posicaoY: 280, nomeDaFase: 'NEBULOSA', dificuldade: 'FÁCIL', imagemDoBotao: 'assets/disco.png', pontosParaVencer: 3, velocidadeDosInimigos: [1.5, 2.5], taxaDeCriacao: [90, 120, 180], vidasDaFase: 5 },
    { idFase: 1, posicaoX: 400, posicaoY: 280, nomeDaFase: 'ASTEROIDES', dificuldade: 'NORMAL', imagemDoBotao: 'assets/disco2.png', pontosParaVencer: 5, velocidadeDosInimigos: [2.5, 4.0], taxaDeCriacao: [70, 100, 150], vidasDaFase: 5 },
    { idFase: 2, posicaoX: 600, posicaoY: 280, nomeDaFase: 'TEMPESTADE', dificuldade: 'DIFÍCIL', imagemDoBotao: 'assets/disco3.png', pontosParaVencer: 8, velocidadeDosInimigos: [3.5, 5.5], taxaDeCriacao: [55, 80, 120], vidasDaFase: 4 },
]

// ─── Progresso global (quais fases foram completadas)
let fasesJaCompletadas = [false, false, false];
const fasesSalvas = localStorage.getItem('bombhead_fases');
if (fasesSalvas) {
    fasesJaCompletadas = JSON.parse(fasesSalvas);
}
function salvarProgresso() {
    localStorage.setItem('bombhead_fases', JSON.stringify(fasesJaCompletadas));
}

// ─── Imagem de fundo do mapa ─────────────────
let imagemFundoDoMapa = new Image()
imagemFundoDoMapa.src = 'assets/fundo_fases.png'

// // ─── Hit test: qual fase está nesse ponto? ───
function verificarQualFaseEstaNoPonto(posicaoMouseX, posicaoMouseY) {
    for (let indice = 0; indice < fasesDoJogo.length; indice++) {
        const faseVerificada = fasesDoJogo[indice]
        const distanciaNoX = posicaoMouseX - faseVerificada.posicaoX
        const distanciaNoY = posicaoMouseY - faseVerificada.posicaoY
        // Verifica se clicou dentro do círculo aproximado do botão (raio de 30)
        if (Math.sqrt(distanciaNoX * distanciaNoX + distanciaNoY * distanciaNoY) <= 30) return indice
    }
    return -1
}

// ─── Desenha o mapa de fases ─────────────────
function desenha_mapa() {
    // Fundo
    if (imagemFundoDoMapa.complete && imagemFundoDoMapa.naturalWidth > 0) {
        contexto.drawImage(imagemFundoDoMapa, 0, 0, 800, 560)
    } else {
        contexto.fillStyle = '#08001f'
        contexto.fillRect(0, 0, 800, 560)
    }

    // Overlay escuro para dar contraste
    contexto.fillStyle = 'rgba(0, 0, 10, 0.30)'
    contexto.fillRect(0, 0, 800, 560)

    // ── Linhas de conexão entre fases ──
    for (let i = 0; i < fasesDoJogo.length - 1; i++) {
        const faseAtualNaLinha = fasesDoJogo[i]
        const proximaFaseNaLinha = fasesDoJogo[i + 1]
        contexto.beginPath()
        contexto.moveTo(faseAtualNaLinha.posicaoX, faseAtualNaLinha.posicaoY)
        contexto.lineTo(proximaFaseNaLinha.posicaoX, proximaFaseNaLinha.posicaoY)
        contexto.strokeStyle = fasesJaCompletadas[i] ? 'rgba(255, 220, 80, 0.45)' : 'rgba(255,255,255,0.10)'
        contexto.lineWidth = 2
        contexto.stroke()
    }

    // ── Botões de fase (agora são apenas imagens) ──
    for (let i = 0; i < fasesDoJogo.length; i++) {
        const faseASerDesenhada = fasesDoJogo[i]
        const aFaseEstaDesbloqueada = i === 0 || fasesJaCompletadas[i - 1]
        const centroDaImagemHeroiX = personagemNoMapa.posicaoX + personagemNoMapa.largura / 2
        const centroDaImagemHeroiY = personagemNoMapa.posicaoY + personagemNoMapa.altura / 2
        const oHeroiEstaNessaFase = verificarQualFaseEstaNoPonto(centroDaImagemHeroiX, centroDaImagemHeroiY) === i && aFaseEstaDesbloqueada

        // Se estiver bloqueada, desenha com transparência
        if (!aFaseEstaDesbloqueada) {
            contexto.globalAlpha = 0.3
        }

        // Desenha a imagem (usando pegarImagem do Util.js)
        contexto.drawImage(pegarImagem(faseASerDesenhada.imagemDoBotao), faseASerDesenhada.posicaoX - 30, faseASerDesenhada.posicaoY - 30, 60, 60)

        contexto.globalAlpha = 1 // reseta a transparência

        // Label: nome e dificuldade
        const posicaoYTextosBaixo = faseASerDesenhada.posicaoY + 30 + 14
        contexto.textAlign = 'center'
        contexto.font = 'bold 12px Arial'
        contexto.fillStyle = aFaseEstaDesbloqueada ? '#fff' : 'rgba(255,255,255,0.3)'
        contexto.fillText(faseASerDesenhada.nomeDaFase, faseASerDesenhada.posicaoX, posicaoYTextosBaixo)
        contexto.font = '10px Arial'
        contexto.fillStyle = aFaseEstaDesbloqueada ? '#aaa' : 'rgba(255,255,255,0.2)'
        contexto.fillText(faseASerDesenhada.dificuldade, faseASerDesenhada.posicaoX, posicaoYTextosBaixo + 13)

        // Indicador [ ENTER ] quando o herói está em cima
        if (oHeroiEstaNessaFase) {
            contexto.font = 'bold 10px Arial'
            contexto.fillStyle = '#fff'
            contexto.fillText('[ ENTER ]', faseASerDesenhada.posicaoX, faseASerDesenhada.posicaoY - 30 - 10)
        }
    }

    // Título do mapa
    contexto.textAlign = 'center'
    contexto.font = 'bold 24px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.9)'
    contexto.fillText('SELECIONE A FASE', 400, 40)

    // Instrução ESC
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Menu', 400, 540)
}