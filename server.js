import express from "express";
import { Game } from "./Game.js"; // 1. Импортируем нашу игру
import { Enemy } from "./Enemy.js"; // Чтобы не было ошибок с null

const app = express();
const PORT = 3000;

// Создаем игру один раз при запуске сервера
const myGame = new Game();
// Важный фикс для консольной версии (как мы делали раньше)
myGame.currentEnemy = new Enemy("Server Goblin", 100, 10);

// Главная страница
app.get("/", (req, res) => {
  res.send(
    '<h1>Сервер RPG работает! 🐉</h1><p>Иди на <a href="/game-status">/game-status</a> чтобы увидеть героя.</p>',
  );
});

// 🔥 МАГИЯ: Сервер отдает состояние игры
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

// 🔥 МАГИЯ 2: Удар по ссылке!
app.get("/hit", (req, res) => {
  // 1. Бьем врага
  myGame.currentEnemy.takeDamage(myGame.hero.damage);

  // 2. Отвечаем клиенту, что случилось
  res.json({
    message: "Ты ударил врага!",
    damageDealt: myGame.hero.damage,
    enemyHpLeft: myGame.currentEnemy.hp,
  });
});

app.listen(PORT, () => {
  console.log(`RPG Сервер запущен на http://localhost:${PORT}`);
});
