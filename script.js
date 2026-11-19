let indiceMusicaAtual = 1;
const totalMusicas = 4;

let disco;
let audios = [];

document.addEventListener("DOMContentLoaded", function () {

    disco = document.getElementById("disco");

    for (let i = 1; i <= totalMusicas; i++) {
        const audio = document.getElementById(`audio-player-${i}`);

        if (audio) {
            audios.push(audio);
            audio.addEventListener("ended", proximaMusica);
        }
    }

    window.alternarPlayPausa = function () {
        const audioAtual = obterAudioAtual();

        if (!audioAtual || !disco) return;

        if (audioAtual.paused) {
            audioAtual.play()
                .then(() => disco.classList.add("girando"))
                .catch(error => console.warn("Erro ao reproduzir música:", error));
        } else {
            audioAtual.pause();
            disco.classList.remove("girando");
        }
    };

    function obterAudioAtual() {
        return document.getElementById(`audio-player-${indiceMusicaAtual}`);
    }

    function proximaMusica() {
        indiceMusicaAtual++;

        if (indiceMusicaAtual > totalMusicas) {
            indiceMusicaAtual = 1;
        }

        const proximoAudio = obterAudioAtual();

        if (proximoAudio) {
            proximoAudio.play()
                .then(() => disco.classList.add("girando"))
                .catch(error => console.warn("Erro ao trocar música:", error));
        }
    }

    function atualizarInterruptor(tema) {
        const imgClaro = document.getElementById("imgModoClaro");
        const imgEscuro = document.getElementById("imgModoEscuro");

        if (!imgClaro || !imgEscuro) return;

        if (tema === "dark") {
            document.body.classList.add("dark-mode");
            imgClaro.classList.remove("ativo");
            imgEscuro.classList.add("ativo");
        } else {
            document.body.classList.remove("dark-mode");
            imgEscuro.classList.remove("ativo");
            imgClaro.classList.add("ativo");
        }
    }

    window.alternarTema = function () {
        const temaAtual = document.body.classList.contains("dark-mode")
            ? "dark"
            : "light";

        const novoTema = temaAtual === "dark" ? "light" : "dark";

        atualizarInterruptor(novoTema);
        localStorage.setItem("temaSalvo", novoTema);
    };

    window.escolherTemaInicial = function (tema) {
        atualizarInterruptor(tema);
        localStorage.setItem("temaSalvo", tema);

        const popup = document.getElementById("popupTema");

        if (popup) {
            popup.style.display = "none";
        }
    };

    const popupTema = document.getElementById("popupTema");
    const temaSalvo = localStorage.getItem("temaSalvo");

    if (temaSalvo === "light" || temaSalvo === "dark") {
        atualizarInterruptor(temaSalvo);

        if (popupTema) {
            popupTema.style.display = "none";
        }
    } else {
        if (popupTema) {
            popupTema.style.display = "flex";
        }
    }

    const canvas = document.getElementById("gameCanvas");
    const widgetCorpo = document.getElementById("widgetCorpo");
    const setaWidget = document.getElementById("setaWidget");
    const scoreElemento = document.getElementById("score");

    if (!canvas || !widgetCorpo || !scoreElemento) return;

    const ctx = canvas.getContext("2d");

    const imgRabanete = new Image();
    const imgColuna = new Image();

    imgRabanete.src = "https://i.postimg.cc/sgtwkZWy/rabanete.png";
    imgColuna.src = "https://i.postimg.cc/vZFyGhpT/coluna.png";

    let gameInterval = null;
    let gameRunning = false;
    let widgetAberto = false;
    let exibindoPopUpFacil = false;
    let modoFacilAtivo = localStorage.getItem("modoFacilAtivo") === "true";

    let score = 0;
    let highScore = Number(localStorage.getItem("rabaneteHighScore")) || 0;
    let derrotasSeguidas = Number(localStorage.getItem("rabaneteDerrotas")) || 0;
    let frameCount = 0;

    let rabanete;
    let colunas = [];

    function atualizarPlacarTexto() {
        let textoModo = modoFacilAtivo
            ? ' | <span id="btnDesativarFacil" style="color: #f56c1c; cursor: pointer; text-decoration: underline;">Fácil ❀ (Sair)</span>'
            : "";

        scoreElemento.innerHTML =
            `Pontos: ${score} | Recorde: ${highScore}${textoModo}`;

        const botaoFacil = document.getElementById("btnDesativarFacil");

        if (botaoFacil) {
            botaoFacil.addEventListener("click", desativarModoFacil);
        }
    }

    function resetGame() {
        rabanete = {
            x: 50,
            y: 100,
            width: 36,
            height: 36,
            velocity: 0,
            gravity: 0.18,
            jump: -3.8
        };

        colunas = [];
        score = 0;
        frameCount = 0;

        atualizarPlacarTexto();
    }

    function desenharRabanete() {
        if (imgRabanete.complete && imgRabanete.naturalWidth > 0) {
            ctx.drawImage(
                imgRabanete,
                rabanete.x,
                rabanete.y,
                rabanete.width,
                rabanete.height
            );
        } else {
            ctx.fillStyle = "#e8885b";
            ctx.beginPath();
            ctx.arc(rabanete.x + 18, rabanete.y + 18, 17, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#c52a2a";
            ctx.fillRect(rabanete.x + 14, rabanete.y - 4, 8, 10);
        }
    }

    function desenharColuna(x, y, largura, altura) {
        if (imgColuna.complete && imgColuna.naturalWidth > 0) {
            ctx.drawImage(imgColuna, x, y, largura, altura);
        } else {
            ctx.fillStyle = "#c52a2a";
            ctx.fillRect(x, y, largura, altura);

            ctx.fillStyle = "#c52a2a";
            ctx.fillRect(x - 4, y, largura + 8, 12);
        }
    }

    function impulsionarRabanete() {
        if (exibindoPopUpFacil || !widgetAberto) return;

        if (!gameRunning) {
            resetGame();
            gameRunning = true;
        }

        rabanete.velocity = rabanete.jump;
    }

    function desenharFimDeJogo() {
        ctx.fillStyle = "rgba(133, 93, 41, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 20px Arial";
        ctx.fillText("Fim de Jogo!", canvas.width / 2, 110);

        ctx.font = "12px Arial";
        ctx.fillText("Clique aqui para recomeçar", canvas.width / 2, 150);

        ctx.textAlign = "left";
    }

    function desenharPopupFacil() {
        ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(40, 25, 35, 0.95)";
        ctx.fillRect(20, 40, 200, 150);

        ctx.strokeStyle = "rgb(255, 202, 171)";
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 40, 200, 150);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Deseja ativar o Modo Fácil?", 120, 70);

        ctx.font = "11px Arial";
        ctx.fillText("Você parece estar sofrendo", 120, 100);
        ctx.fillText("mais que o esperado.", 120, 115);
        ctx.fillText("(˵ ¬ᴗ¬˵)", 120, 130);

        ctx.fillStyle = "rgb(180, 60, 30)";
        ctx.fillRect(35, 140, 80, 30);

        ctx.fillStyle = "#555";
        ctx.fillRect(125, 140, 80, 30);

        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Sim", 75, 159);
        ctx.fillText("Não", 165, 159);

        ctx.textAlign = "left";
    }

    function gameOver() {
        if (!gameRunning) return;

        gameRunning = false;

        if (score < 4 && !modoFacilAtivo) {
            derrotasSeguidas++;

            localStorage.setItem("rabaneteDerrotas", derrotasSeguidas);
        }

        if (derrotasSeguidas >= 8 && !modoFacilAtivo) {
            exibindoPopUpFacil = true;
        }
    }

    function desativarModoFacil() {
        modoFacilAtivo = false;
        localStorage.setItem("modoFacilAtivo", "false");

        derrotasSeguidas = 0;
        localStorage.setItem("rabaneteDerrotas", "0");

        exibindoPopUpFacil = false;

        resetGame();
        gameRunning = true;
    }

    window.desativarModoFacil = desativarModoFacil;

    function updateGame() {
        if (!widgetAberto) return;

        frameCount++;

        ctx.fillStyle = document.body.classList.contains("dark-mode")
            ? "#4fa3e3"
            : "#4fa3e3";

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (exibindoPopUpFacil) {
            desenharRabanete();
            desenharPopupFacil();
            return;
        }

        if (gameRunning) {
            rabanete.velocity += rabanete.gravity;
            rabanete.y += rabanete.velocity;
        }

        desenharRabanete();

        const rabHitbox = {
            left: rabanete.x + 6,
            right: rabanete.x + rabanete.width - 6,
            top: rabanete.y + 4,
            bottom: rabanete.y + rabanete.height - 4
        };

        if (modoFacilAtivo) {
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 2;

            ctx.strokeRect(
                rabHitbox.left,
                rabHitbox.top,
                rabHitbox.right - rabHitbox.left,
                rabHitbox.bottom - rabHitbox.top
            );
        }

        if (gameRunning && frameCount % 95 === 0) {
            const gap = 95;
            const minHeight = 35;
            const maxHeight = canvas.height - gap - minHeight;

            const altura = Math.floor(
                Math.random() * (maxHeight - minHeight + 1)
            ) + minHeight;

            colunas.push({
                x: canvas.width,
                width: 56,
                height: 180,
                topY: altura - 180,
                bottomY: altura + gap,
                passou: false
            });
        }

        for (let i = colunas.length - 1; i >= 0; i--) {
            const coluna = colunas[i];

            if (gameRunning) {
                coluna.x -= 1.8;
            }

            desenharColuna(
                coluna.x,
                coluna.topY,
                coluna.width,
                coluna.height
            );

            desenharColuna(
                coluna.x,
                coluna.bottomY,
                coluna.width,
                coluna.height
            );

            const colunaHitbox = {
                left: coluna.x + 4,
                right: coluna.x + coluna.width - 4
            };

            if (modoFacilAtivo) {
                ctx.strokeStyle = "lime";
                ctx.lineWidth = 2;

                ctx.strokeRect(
                    colunaHitbox.left,
                    coluna.topY,
                    colunaHitbox.right - colunaHitbox.left,
                    coluna.height
                );

                ctx.strokeRect(
                    colunaHitbox.left,
                    coluna.bottomY,
                    colunaHitbox.right - colunaHitbox.left,
                    coluna.height
                );
            }

            if (
                gameRunning &&
                rabHitbox.right > colunaHitbox.left &&
                rabHitbox.left < colunaHitbox.right
            ) {
                if (
                    rabHitbox.top < coluna.topY + coluna.height ||
                    rabHitbox.bottom > coluna.bottomY
                ) {
                    gameOver();
                }
            }

            if (
                gameRunning &&
                !coluna.passou &&
                coluna.x + coluna.width < rabanete.x
            ) {
                coluna.passou = true;
                score++;

                if (score >= 4) {
                    derrotasSeguidas = 0;
                    localStorage.setItem("rabaneteDerrotas", "0");
                }

                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("rabaneteHighScore", highScore);
                }

                atualizarPlacarTexto();
            }

            if (coluna.x + coluna.width < 0) {
                colunas.splice(i, 1);
            }
        }

        if (
            gameRunning &&
            (
                rabanete.y + rabanete.height > canvas.height ||
                rabanete.y < 0
            )
        ) {
            gameOver();
        }

        if (!gameRunning && !exibindoPopUpFacil) {
            desenharFimDeJogo();
        }
    }

    window.alternarWidget = function () {
        widgetAberto = !widgetAberto;

        if (widgetAberto) {
            widgetCorpo.style.display = "block";

            if (setaWidget) {
                setaWidget.innerText = "❀";
            }

            resetGame();
            gameRunning = true;

            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, 20);
        } else {
            widgetCorpo.style.display = "none";
            gameRunning = false;

            if (setaWidget) {
                setaWidget.innerText = "❀";
            }

            clearInterval(gameInterval);
        }
    };

    canvas.addEventListener("click", function (event) {
        if (!widgetAberto) return;

        if (exibindoPopUpFacil) {
            const rect = canvas.getBoundingClientRect();

            const escalaX = canvas.width / rect.width;
            const escalaY = canvas.height / rect.height;

            const x = (event.clientX - rect.left) * escalaX;
            const y = (event.clientY - rect.top) * escalaY;

            if (y >= 140 && y <= 170) {
                if (x >= 35 && x <= 115) {
                    modoFacilAtivo = true;
                    localStorage.setItem("modoFacilAtivo", "true");

                    derrotasSeguidas = 0;
                    localStorage.setItem("rabaneteDerrotas", "0");

                    exibindoPopUpFacil = false;
                    resetGame();
                    gameRunning = true;
                } else if (x >= 125 && x <= 205) {
                    exibindoPopUpFacil = false;
                    resetGame();
                    gameRunning = true;
                }
            }

            return;
        }

        impulsionarRabanete();
    });

    document.addEventListener("keydown", function (event) {
        if (event.code === "Space" && widgetAberto) {
            event.preventDefault();
            impulsionarRabanete();
        }
    });

    resetGame();

});