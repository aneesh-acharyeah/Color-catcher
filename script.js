// Game elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const scoreText = document.getElementById("scoreText");
const highScoreText = document.getElementById("highScoreText");
const restartButton = document.getElementById("restartButton");

// Game state
let paddle, blocks, colors, score, misses, gameOver, lastTime, deltaTime;
let paddleColor, colorChangeInterval;
let highScore = localStorage.getItem("colorCatcherHighScore") || 0;

// Initialize game
function init() {
  paddle = { x: canvas.width / 2 - 40, y: canvas.height - 20, width: 80, height: 15 };
  blocks = [];
  colors = ["#00ffcc", "#ff0066", "#ffcc00", "#33ff00"];
  paddleColor = getRandomColor();
  score = 0;
  misses = 0;
  gameOver = false;
  lastTime = performance.now();

  // Hide overlay
  overlay.style.display = "none";

  // Update high score display
  updateHighScoreDisplay();

  // Change paddle color every 5 seconds
  clearInterval(colorChangeInterval);
  colorChangeInterval = setInterval(() => {
    paddleColor = getRandomColor();
  }, 5000);
}

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnBlock() {
  const color = getRandomColor();
  const size = 20;
  const x = Math.random() * (canvas.width - size);
  blocks.push({ x, y: -size, size, color });
}

function update() {
  if (gameOver) return;

  const now = performance.now();
  deltaTime = (now - lastTime) / 1000; // seconds
  lastTime = now;

  // Move blocks down
  const speed = 150; // pixels per second
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    block.y += speed * deltaTime;

    // Check collision with paddle
    if (
      block.y + block.size >= paddle.y &&
      block.y <= paddle.y + paddle.height &&
      block.x < paddle.x + paddle.width &&
      block.x + block.size > paddle.x
    ) {
      if (block.color === paddleColor) {
        score += 10;
        createParticles(block.x + block.size / 2, block.y + block.size / 2, block.color);
      } else {
        score = Math.max(0, score - 5);
      }
      blocks.splice(i, 1);
    }
    // Missed block
    else if (block.y > canvas.height) {
      if (block.color === paddleColor) {
        misses++;
        if (misses >= 3) endGame();
      }
      blocks.splice(i, 1);
    }
  }

  // Random spawn
  if (Math.random() < 0.02 * deltaTime * 60) {
    spawnBlock();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw paddle
  ctx.fillStyle = paddleColor;
  ctx.shadowBlur = 20;
  ctx.shadowColor = paddleColor;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Draw blocks
  blocks.forEach(block => {
    ctx.fillStyle = block.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = block.color;
    ctx.fillRect(block.x, block.y, block.size, block.size);
  });

  // Reset shadow for UI
  ctx.shadowBlur = 0;

  // Draw score and misses
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Misses: ${misses}/3`, 10, 60);

  // Draw target color hint
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "16px Arial";
  ctx.fillText("Catch:", 10, 90);
  ctx.fillStyle = paddleColor;
  ctx.fillRect(70, 78, 20, 20);
}

// Simple particle effect
const particles = [];
function createParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 100,
      vy: (Math.random() - 0.5) * 100,
      color,
      life: 1.0
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.vy += 30 * deltaTime; // gravity
    p.life -= 5 * deltaTime;

    if (p.life <= 0) {
      particles.splice(i, 1);
    } else {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
  }
  ctx.globalAlpha = 1;
}

function drawWithParticles() {
  draw();
  updateParticles();
}

function gameLoop() {
  update();
  drawWithParticles();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("colorCatcherHighScore", highScore);
  }
  scoreText.textContent = `Your Score: ${score}`;
  highScoreText.textContent = `High Score: ${highScore}`;
  overlay.style.display = "block";
}

function restartGame() {
  clearInterval(colorChangeInterval);
  init();
}

function updateHighScoreDisplay() {
  highScore = localStorage.getItem("colorCatcherHighScore") || 0;
  highScoreText.textContent = `High Score: ${highScore}`;
}

// Mouse movement
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = mouseX - paddle.width / 2;

  // Keep paddle in bounds
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
});

// Touch support for mobile
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddle.x = touchX - paddle.width / 2;

  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
});

// Prevent space from scrolling
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") e.preventDefault();
});

// Restart button
restartButton.addEventListener("click", restartGame);

// Start game
init();
gameLoop();
