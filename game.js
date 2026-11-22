'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const TRIPLE_DURATION = 10;    // segundos de disparo triple
const TRIPLE_SPREAD   = 0.2;   // separación angular del abanico (rad)
const SHIELD_DURATION = 5;     // segundos de escudo temporal
const SHIELD_RADIUS   = 22;    // radio del círculo de energía
const SHIELD_GRACE    = 1;     // invencibilidad tras absorber un golpe (s)

class Ship {
  constructor() {
    // Efectos de power-up (se conservan entre niveles, se pierden al morir)
    this.tripleShot = 0;   // tiempo restante de disparo triple
    this.shield     = 0;   // tiempo restante de escudo
    this.reset();
  }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot    > 0) this.tripleShot    = Math.max(0, this.tripleShot - dt);
    if (this.shield        > 0) this.shield        = Math.max(0, this.shield - dt);

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      // Abanico de 3 balas
      return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD].map(d => new Bullet(ox, oy, this.angle + d));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;

    // Escudo: círculo de energía (parpadea el último segundo)
    if (this.shield > 0 && !(this.shield < 1 && Math.floor(this.shield * 10) % 2 === 0)) {
      const pulse = 1 + Math.sin(performance.now() / 120) * 0.05;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,220,0,0.9)';
      ctx.lineWidth   = 2;
      ctx.shadowColor = '#fd0';
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, SHIELD_RADIUS * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUP_DROP_CHANCE = 0.1;// probabilidad por asteroide destruido
const POWERUP_TTL         = 8;      // segundos antes de desaparecer si no se recoge

// Cada tipo aparece como máximo una vez por partida
const POWERUP_TYPES = {
  triple: { rgb: '0,255,255', title: '¡DISPARO TRIPLE!', duration: TRIPLE_DURATION },
  shield: { rgb: '255,220,0', title: '¡ESCUDO!',         duration: SHIELD_DURATION },
};

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 10;
    this.ttl  = POWERUP_TTL;
    this.time = 0;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.time += dt;
    this.ttl  -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo durante los últimos 2 segundos
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const pulse = 1 + Math.sin(this.time * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = `rgb(${POWERUP_TYPES[this.type].rgb})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    if (this.type === 'triple') {
      // Tres líneas en abanico apuntando hacia arriba
      for (const d of [-0.5, 0, 0.5]) {
        const a = -Math.PI / 2 + d;
        ctx.moveTo(0, 4);
        ctx.lineTo(Math.cos(a) * 7, 4 + Math.sin(a) * 10);
      }
    } else {
      // Silueta de escudo
      ctx.moveTo(0, -6);
      ctx.lineTo(5, -4);
      ctx.lineTo(5, 0);
      ctx.quadraticCurveTo(5, 4, 0, 7);
      ctx.quadraticCurveTo(-5, 4, -5, 0);
      ctx.lineTo(-5, -4);
      ctx.closePath();
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles;
let powerUp;          // PowerUp en pantalla o null
let powerUpsUsed;     // { triple, shield }: true si ya apareció en esta partida
let powerUpMsgType;   // tipo del último power-up recogido (para el mensaje)
let powerUpMsgTimer;  // tiempo restante del mensaje en pantalla
const POWERUP_MSG_DURATION = 2;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUp         = null;
  powerUpsUsed    = { triple: false, shield: false };
  powerUpMsgType  = null;
  powerUpMsgTimer = 0;
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUp   = null;
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.tripleShot = 0;   // al morir se pierden los power-ups
  ship.shield     = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

function updatePowerUp(dt) {
  if (!powerUp) return;
  powerUp.update(dt);
  if (powerUp.dead) powerUp = null;
}

// Intenta soltar un power-up al destruir un asteroide
function maybeDropPowerUp(x, y) {
  if (powerUp) return;   // solo uno en pantalla a la vez
  const available = Object.keys(POWERUP_TYPES).filter(t => !powerUpsUsed[t]);
  if (available.length === 0 || Math.random() >= POWERUP_DROP_CHANCE) return;
  const type = available[randInt(0, available.length - 1)];
  powerUp = new PowerUp(x, y, type);
  powerUpsUsed[type] = true;
}

function collectPowerUp(p) {
  if (p.type === 'triple') ship.tripleShot = TRIPLE_DURATION;
  else                     ship.shield     = SHIELD_DURATION;
  powerUpMsgType  = p.type;
  powerUpMsgTimer = POWERUP_MSG_DURATION;
  explode(p.x, p.y, 10);
}

// Destruye un asteroide: puntos, explosión, fragmentos y posible power-up
function destroyAsteroid(a, newAsteroids) {
  a.dead = true;
  score += POINTS[a.size];
  explode(a.x, a.y, a.size * 5);
  newAsteroids.push(...a.split());
  maybeDropPowerUp(a.x, a.y);
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (powerUpMsgTimer > 0) powerUpMsgTimer = Math.max(0, powerUpMsgTimer - dt);

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    updatePowerUp(dt);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        destroyAsteroid(a, newAsteroids);
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Power-up: movimiento y recogida
  updatePowerUp(dt);
  if (powerUp && !ship.dead && dist(ship, powerUp) < ship.radius + powerUp.radius) {
    collectPowerUp(powerUp);
    powerUp = null;
  }

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    // Con escudo, el radio de impacto es el del círculo de energía
    const shipR = ship.shield > 0 ? SHIELD_RADIUS : ship.radius;
    for (const a of asteroids) {
      if (dist(ship, a) < shipR + a.radius * 0.82) {
        if (ship.shield > 0) {
          // El escudo absorbe el golpe: destruye el asteroide y se consume
          const fragments = [];
          destroyAsteroid(a, fragments);
          asteroids = asteroids.filter(x => !x.dead).concat(fragments);
          ship.shield     = 0;
          ship.invincible = SHIELD_GRACE;   // margen para escapar de los fragmentos
          explode(ship.x, ship.y, 12);
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicadores de power-ups activos (apilados)
  const active = [
    ['TRIPLE', ship.tripleShot, 'triple'],
    ['ESCUDO', ship.shield,     'shield'],
  ].filter(([, t]) => t > 0);

  let y = 48;
  for (const [label, time, type] of active) {
    const { rgb, duration } = POWERUP_TYPES[type];
    const barW = 100;
    ctx.textAlign   = 'left';
    ctx.fillStyle   = `rgb(${rgb})`;
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.font = '13px monospace';
    ctx.fillText(`${label}  ${time.toFixed(1)}s`, 14, y);
    ctx.lineWidth = 1;
    ctx.strokeRect(14, y + 7, barW, 5);
    ctx.fillRect(14, y + 7, barW * (time / duration), 5);
    y += 30;
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  if (powerUp) powerUp.draw();
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  // Mensaje al activar un power-up (se desvanece)
  if (powerUpMsgTimer > 0 && state !== 'gameover') {
    const { rgb, title, duration } = POWERUP_TYPES[powerUpMsgType];
    const t = powerUpMsgTimer / POWERUP_MSG_DURATION;   // 1 → 0
    const alpha = Math.min(1, t * 2);                   // se desvanece en la segunda mitad
    const scale = 1 + (1 - t) * 0.15;                   // crece ligeramente
    ctx.save();
    ctx.translate(W / 2, H / 3);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(2)})`;
    ctx.font = 'bold 36px monospace';
    ctx.fillText(title, 0, 0);
    ctx.font = '15px monospace';
    ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.75).toFixed(2)})`;
    ctx.fillText(`${duration} SEGUNDOS`, 0, 28);
    ctx.restore();
  }

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
