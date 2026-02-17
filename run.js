import { Game } from "./Game.js";

console.log("------------------------------");
console.log("Запуск игры на сервере. Версия: 0.1");
console.log("------------------------------");

const game = new Game();

console.log(`Герой: HP: ${game.hero.hp}, Золото: ${game.hero.gold}`);
console.log(`Инвентарь: ${game.inventory.join(", ")}`);

console.log("\n Наносим тестовый урон герою на 25 HP");
game.hero.takeDamage(25);

console.log(`Текущее HP героя: ${game.hero.hp}`);

if (game.hero.hp < 100) {
  console.log("Test success.");
}

console.log("------------------------------");
