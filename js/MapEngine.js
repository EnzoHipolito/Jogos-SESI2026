// ─── Dados das 3 fases ───────────────────────
const fasesDoJogo = [
    { idFase: 0, posicaoX: 220, posicaoY: 350, nomeDaFase: 'EL CASINO', dificuldade: 'FÁCIL', imagemDoBotao: '../assets/vilao_carta/vilao_carta_01.png', pontosParaVencer: 3, velocidadeDosInimigos: [1.5, 2.5], taxaDeCriacao: [90, 120, 180], vidasDaFase: 5, iconOffsetX: -75, iconOffsetY: -85 },
    { idFase: 1, posicaoX: 500, posicaoY: 360, nomeDaFase: 'A TORMENTA', dificuldade: 'NORMAL', imagemDoBotao: '../assets/vilao_nuvem/vilao_nuvem1.png', pontosParaVencer: 5, velocidadeDosInimigos: [2.5, 4.0], taxaDeCriacao: [70, 100, 150], vidasDaFase: 5, iconOffsetX: -30, iconOffsetY: -90 },
    { idFase: 2, posicaoX: 800, posicaoY: 375, nomeDaFase: 'O GENERAL', dificuldade: 'DIFÍCIL', imagemDoBotao: '../assets/aviao_vilao/31-removebg-preview.png', pontosParaVencer: 8, velocidadeDosInimigos: [3.5, 5.5], taxaDeCriacao: [55, 80, 120], vidasDaFase: 4, iconOffsetX: -35, iconOffsetY: -85 },
]

// ─── Progresso global (quais fases foram completadas)
let fasesJaCompletadas = [false, false, false];
const progressoSalvo = localStorage.getItem('bombhead_fases');
if (progressoSalvo) {
    fasesJaCompletadas = JSON.parse(progressoSalvo);
}
function salvarProgresso() {
    localStorage.setItem('bombhead_fases', JSON.stringify(fasesJaCompletadas));
}

// ─── Imagem de fundo do mapa ─────────────────
let imagemFundoDoMapa = new Image()
imagemFundoDoMapa.src = '../assets/fundo_fases.png'

// // ─── Hit test: qual fase está nesse ponto? ───
function verificarFase(posicaoMouseX, posicaoMouseY) {
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
function desenharMapa() {
    // Fundo
    if (imagemFundoDoMapa.complete && imagemFundoDoMapa.naturalWidth > 0) {
        contexto.drawImage(imagemFundoDoMapa, 0, 0, 1024, 640)
    } else {
        contexto.fillStyle = '#08001f'
        contexto.fillRect(0, 0, 1024, 640)
    }

    // ── Botões de fase (agora são apenas imagens) ──
    for (let i = 0; i < fasesDoJogo.length; i++) {
        const faseASerDesenhada = fasesDoJogo[i]
        const aFaseEstaDesbloqueada = i === 0 || fasesJaCompletadas[i - 1]
        const centroDaImagemHeroiX = personagemNoMapa.posicaoX + personagemNoMapa.largura / 2
        const centroDaImagemHeroiY = personagemNoMapa.posicaoY + personagemNoMapa.altura / 2
        const oHeroiEstaNessaFase = verificarFase(centroDaImagemHeroiX, centroDaImagemHeroiY) === i && aFaseEstaDesbloqueada

        // Se estiver bloqueada, desenha com transparência
        if (!aFaseEstaDesbloqueada) {
            contexto.globalAlpha = 0.3
        }

        // Desenha a imagem (usando pegarImagem do Util.js)
        contexto.drawImage(pegarImagem(faseASerDesenhada.imagemDoBotao), faseASerDesenhada.posicaoX - 50, faseASerDesenhada.posicaoY - 60, 100, 100)

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
    contexto.fillText('SELECIONE A FASE', 512, 40)

    // Instrução ESC
    contexto.font = '14px Arial'
    contexto.fillStyle = 'rgba(255,255,255,0.7)'
    contexto.fillText('Pressione [ESC] para voltar ao Menu', 512, 620)
}