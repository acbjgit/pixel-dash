const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const groundHeight = 100;
let gravity = 1;
let gameSpeed = 6;
let score = 0;
let isNight = false;
let weatherCondition = "Clear";
let currentSkin = "padrao";
let difficultyTimer = 0;
let insaneMode = false;
let moveLeft = false;
let moveRight = false;

const bgMusic = document.getElementById("bgMusic");
const toggleMusicBtn = document.getElementById("toggleMusic");

const fases = [
  { nome: "Campo Claro", clima: "Clear", velocidade: 6, limite: 1000 },
  { nome: "Chuva Escura", clima: "Rain", velocidade: 8, limite: 2000 },
  { nome: "Nevasca", clima: "Snow", velocidade: 10, limite: 3000 }
];
let faseAtual = 0;
let jogoIniciado = false;
let lives = 3;
let lastCheckpoint = { x: 50, y: canvas.height - groundHeight - 50 };

let player = {
  x: 50,
  y: canvas.height - groundHeight - 50,
  width: 50,
  height: 50,
  velocityY: 0,
  jumping: false,
  jumpCount: 0
};

let obstacles = [];

function updateLivesDisplay() {
  document.getElementById("lives").textContent = `Vidas: ${lives}`;
}

function checkTimeForNightMode() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    isNight = true;
    bgMusic.volume = 0.3;
    bgMusic.play();
  }
}

function drawBackground() {
  ctx.fillStyle = isNight ? "#0a0a2a" : "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  ctx.fillStyle = currentSkin === "ninja" ? "#222" :
                  currentSkin === "dragao" ? "#ff9900" : "#00ffcc";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawGround() {
  ctx.fillStyle = isNight ? "#222" : "#444";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

function spawnObstacle() {
  const tipo = Math.random();

  if (tipo < 0.3) {
    // Torre vertical
    for (let i = 0; i < 5; i++) {
      obstacles.push({
        x: canvas.width,
        y: canvas.height - groundHeight - (i + 1) * 40,
        width: 60,
        height: 40,
        color: "#555",
        passed: false
      });
    }
  } else if (tipo < 0.6) {
    // Plataforma suspensa
    obstacles.push({
      x: canvas.width + 100,
      y: canvas.height - groundHeight - 120,
      width: 100,
      height: 20,
      color: "#999",
      passed: false
    });
  } else {
    // Passagem estreita
    obstacles.push({
      x: canvas.width,
      y: canvas.height - groundHeight - 60,
      width: 40,
      height: 60,
      color: "#777",
      passed: false
    });
  }
}

function drawObstacles() {
  obstacles.forEach((obs) => {
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
}

function detectCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function updateScore() {
  document.getElementById("score").textContent = `Pontuação: ${score}`;
}

function verificarSkin(pontuacao) {
  if (pontuacao >= 2000) return "dragao";
  if (pontuacao >= 1000) return "ninja";
  return "padrao";
}

function salvarSkin(skin) {
  localStorage.setItem("skinDesbloqueada", skin);
}

function carregarSkin() {
  const salva = localStorage.getItem("skinDesbloqueada");
  if (salva) currentSkin = salva;
}

function checkCheckpoint() {
  if (score >= 500 && score < 1000) lastCheckpoint = { x: player.x, y: player.y };
  if (score >= 1000 && score < 2000) lastCheckpoint = { x: player.x, y: player.y };
  if (score >= 2000 && score < 3000) lastCheckpoint = { x: player.x, y: player.y };
}

function verificarFase() {
  if (score >= fases[faseAtual].limite) {
    faseAtual++;
    if (faseAtual >= fases.length) {
      mostrarTelaVitoria();
      return;
    }
    gameSpeed = fases[faseAtual].velocidade;
    weatherCondition = fases[faseAtual].clima;
    alert(`Fase ${faseAtual + 1}: ${fases[faseAtual].nome}`);
  }
}

function mostrarTelaVitoria() {
  jogoIniciado = false;
  document.getElementById("pontuacaoFinal").textContent = `Pontuação final: ${score}`;
  document.getElementById("telaVitoria").style.display = "block";
}

function update() {
  if (!jogoIniciado) return;

  drawBackground();
  verificarFase();
  checkCheckpoint();

  if (moveLeft) player.x -= 5;
  if (moveRight) player.x += 5;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  player.velocityY += gravity;
  player.y += player.velocityY;

  let onPlatform = false;

  obstacles.forEach((obs) => {
    obs.x -= gameSpeed;

    if (
      player.y + player.height <= obs.y + player.velocityY &&
      player.x + player.width > obs.x &&
      player.x < obs.x + obs.width &&
      player.y + player.height >= obs.y
    ) {
      player.y = obs.y - player.height;
      player.velocityY = 0;
      player.jumping = false;
      player.jumpCount = 0;
      onPlatform = true;
    }

    if (detectCollision(player, obs)) {
      if (player.x < obs.x) {
        player.x = obs.x - player.width;
      } else {
        player.x = obs.x + obs.width;
      }
    }

    if (!obs.passed && obs.x + obs.width < player.x) {
      score += 10;
      obs.passed = true;
      updateScore();

      const novaSkin = verificarSkin(score);
      if (novaSkin !== currentSkin) {
        currentSkin = novaSkin;
        salvarSkin(novaSkin);
      }

      if (score >= 1000 && !insaneMode) {
        insaneMode = true;
        gameSpeed += 5;
      }
    }
  });

  if (player.y + player.height >= canvas.height - groundHeight && !onPlatform) {
    player.y = canvas.height - groundHeight - player.height;
    player.velocityY = 0;
    player.jumping = false;
    player.jumpCount = 0;
  }

  if (player.x + player.width < 0) {
    lives--;
    updateLivesDisplay();

    if (lives <= 0) {
      alert(`Game Over! Pontuação final: ${score}`);
      score = 0;
      lives = 3;
      faseAtual = 0;
      updateScore();
      updateLivesDisplay();
      currentSkin = "padrao";
      insaneMode = false;
      gameSpeed = fases[0].velocidade;
      weatherCondition = fases[0].clima;
      lastCheckpoint = { x: 50, y: canvas.height - groundHeight - 50 };
    }

    player.x = lastCheckpoint.x;
    player.y = lastCheckpoint.y;
    player.jumpCount = 0;
  }

  obstacles = obstacles.filter(obs => obs.x + obs.width > -100);

  drawGround();
  drawPlayer();
  drawObstacles();

  requestAnimationFrame(update);
}

document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "ArrowUp") && player.jumpCount < 2) {
    player.velocityY = -20;
    player.jumping = true;
    player.jumpCount++;
  }
    if (e.code === "ArrowRight") moveRight = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") moveLeft = false;
  if (e.code === "ArrowRight") moveRight = false;
});

document.getElementById("btnLeft").addEventListener("touchstart", () => moveLeft = true);
document.getElementById("btnLeft").addEventListener("touchend", () => moveLeft = false);
document.getElementById("btnRight").addEventListener("touchstart", () => moveRight = true);
document.getElementById("btnRight").addEventListener("touchend", () => moveRight = false);

toggleMusicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    toggleMusicBtn.textContent = "🔊 Música";
  } else {
    bgMusic.pause();
    toggleMusicBtn.textContent = "🔇 Música";
  }
});

document.getElementById("btnIniciar").addEventListener("click", () => {
  document.getElementById("telaInicio").style.display = "none";
  jogoIniciado = true;
  update();
});

document.getElementById("btnReiniciar").addEventListener("click", () => {
  document.getElementById("telaVitoria").style.display = "none";
  score = 0;
  faseAtual = 0;
  lives = 3;
  gameSpeed = fases[0].velocidade;
  weatherCondition = fases[0].clima;
  player.x = 50;
  player.y = canvas.height - groundHeight - 50;
  obstacles = [];
  updateScore();
  updateLivesDisplay();
  jogoIniciado = true;
  update();
});

setInterval(spawnObstacle, 2000);

setInterval(() => {
  if (!insaneMode) {
    gameSpeed += 0.5;
    difficultyTimer += 30;
    console.log(`Dificuldade aumentada: velocidade = ${gameSpeed}`);
  }
}, 30000);

checkTimeForNightMode();
carregarSkin();
updateLivesDisplay();
