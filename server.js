import express from "express";
import cors from "cors";
import { Game } from "./Game.js"; // 1. Импортируем нашу игру
import { Enemy } from "./Enemy.js"; // Чтобы не было ошибок с null

const app = express();
const PORT = 3000;

// Подключение CORS (возможность серверу брать информацию из другого источника. Источник как сервер, так и пк может быть)
app.use(cors());

// Учим сервер понимать json
app.use(express.json());

// Создаем игру один раз при запуске сервера
const myGame = new Game();

const calculateWeaponDamage = (base) => {
  const variance = 0.2;
  const min = Math.ceil(base * (1 - variance));
  const max = Math.floor(base * (1 + variance));
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const applyCrit = (damage) => {
  const CRIT_CHANCE = 0.3;
  if (Math.random() < CRIT_CHANCE) {
    return damage * 2.0;
  }
  return damage;
};

// Для консоли прописал стокового врага
myGame.currentEnemy = new Enemy("Server Goblin", 100, 10);

// Главная страница
app.get("/", (req, res) => {
  res.send(
    '<h1>Сервер RPG работает! 🐉</h1><p>Иди на <a href="/game-status">/game-status</a> чтобы увидеть героя.</p>',
  );
});

// Сервер отдает состояние игры
app.get("/game-status", (req, res) => {
  // Мы берем данные из JS-объекта и отправляем их как JSON (текст)
  res.json({
    heroHp: myGame.hero.hp,
    gold: myGame.hero.gold,
    inventory: myGame.inventory,
    enemyName: myGame.currentEnemy.name,
    enemyHp: myGame.currentEnemy.hp,
  });
});

app.get("/enemy-attack", (req, res) => {
  const currentLevel = parseInt(req.query.level) || 1;

  const ENEMY_LEVEL_MULTI = 0.2;

  const levelMultiplier = 1 + currentLevel * ENEMY_LEVEL_MULTI;
  const scaledDamage = Math.floor(myGame.currentEnemy.damage * levelMultiplier);

  myGame.hero.takeDamage(scaledDamage);

  res.json({
    message: "Враг нанес ответный удар!",
    damageDealt: scaledDamage,
    heroHpLeft: myGame.hero.hp,
    critLevel: levelMultiplier.toFixed(1),
  });
});

app.get("/hit", (req, res) => {
  const heroBaseDamage = myGame.hero.damage;

  const rawDamage = calculateWeaponDamage(heroBaseDamage);
  const finalDamage = applyCrit(rawDamage);

  const isCrit = finalDamage > rawDamage;

  myGame.currentEnemy.takeDamage(finalDamage);

  res.json({
    message: isCrit ? "Critical Hit!" : "Regular Hit!",
    damageDealt: finalDamage,
    isCrit: isCrit,
    enemyHpLeft: myGame.currentEnemy.hp,
  });
});

app.get("/bomb", (req, res) => {
  const bombDamage = 50;

  myGame.currentEnemy.takeDamage(bombDamage);

  res.json({
    message: "BOOM! Server read explosion!",
    damageDealt: bombDamage,
    enemyHpLeft: myGame.currentEnemy.hp,
  });
});

app.get("/heal-hero", (req, res) => {
  myGame.hero.hp = myGame.hero.maxHp;

  res.json({
    message: "Hero was healed on server.",
    heroHp: myGame.hero.hp,
  });
});

app.get("/reset-hero", (req, res) => {
  myGame.hero.hp = 100;
  myGame.hero.maxHp = 100;
  myGame.hero.damage = 10;

  res.json({
    message: "Hero stats was successfully reset to default.",
  });
});

app.get("/level-up", (req, res) => {
  const newMaxHp = parseInt(req.query.maxHp);
  const newHp = parseInt(req.query.hp);
  const newDamage = parseInt(req.query.damage);

  if (newMaxHp) myGame.hero.maxHp = newMaxHp;
  if (newHp) myGame.hero.hp = newHp;
  if (newDamage) myGame.hero.damage = newDamage;

  res.json({
    message: "Hero leveled up. Server wrote it.",
    heroStats: myGame.hero,
  });
});

app.get("/sync", (req, res) => {
  const syncEnemyHp = parseInt(req.query.hp) || 100;
  const syncEnemyName = req.query.name || "Unknown";

  myGame.currentEnemy.hp = syncEnemyHp;
  myGame.currentEnemy.maxHp = syncEnemyHp;
  myGame.currentEnemy.name = syncEnemyName;

  res.json({
    message: "Server synchronized. New enemy ready to fight.",
    enemyStatus: myGame.currentEnemy,
  });
});

// load and save

app.post("/save-game", (req, res) => {
  const savedLevel = req.body.level;
  const savedInventory = req.body.inventory;
  const savedGold = req.body.gold;

  if (savedLevel) myGame.level = savedLevel;
  if (savedInventory) myGame.inventory = savedInventory;
  if (savedGold) myGame.hero.gold = savedGold;

  res.json({ message: "Save successed." });
});

app.get("/load-game", (req, res) => {
  res.json({
    level: myGame.level || 1,
    inventory: myGame.inventory || [],
    heroStats: {
      hp: myGame.hero.hp,
      maxHp: myGame.hero.maxHp,
      damage: myGame.hero.damage,
      gold: myGame.hero.gold,
    },
  });
});

app.listen(PORT, () => {
  console.log(`RPG Сервер запущен на http://localhost:${PORT}`);
});
