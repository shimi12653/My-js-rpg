import readline from "readline";
import { Game } from "./Game.js";
import { Enemy } from "./Enemy.js";
import { GAME_STATE, ITEMS } from "./constants.js";

// 1. Настраиваем "читалку" консоли
const rl = readline.createInterface({
  input: process.stdin, // Откуда читаем (клавиатура)
  output: process.stdout, // Куда пишем (терминал)
});

// 2. Создаем игру
const game = new Game();

game.currentEnemy = new Enemy("Goblin Console Edition", 100, 10);

console.log("=========================================");
console.log(" ДОБРО ПОЖАЛОВАТЬ В КОНСОЛЬНУЮ RPG ");
console.log("=========================================");

const askQuestion = () => {
  console.log(`\n--- ХОД ИГРОКА ---`);
  console.log(`Герой: ❤️ ${game.hero.hp} | 💰 ${game.hero.gold}`);
  console.log(
    `Враг:  👹 HP ${game.currentEnemy ? game.currentEnemy.hp : "???"}`,
  );
  console.log(`Инвентарь: [ ${game.inventory.join(", ")} ]`);

  console.log("\nДействия:");
  console.log("1. ⚔️ Атаковать");
  console.log("2. 🧪 Выпить зелье");
  console.log("3. 💣 Кинуть бомбу");
  console.log("4. 🚪 Выйти");

  rl.question("Твой выбор (введи цифру): ", (answer) => {
    handleInput(answer);
  });
};

const handleInput = (choice) => {
  console.clear();

  if (choice === "1") {
    console.log("⚔️ Ты атакуешь врага!");
    game.currentEnemy.takeDamage(game.hero.damage);
    console.log(`Враг получил ${game.hero.damage} урона.`);
  } else if (choice === "2") {
    if (game.inventory.includes(ITEMS.POTION)) {
      game.hero.heal(50);
      const index = game.inventory.indexOf(ITEMS.POTION);
      if (index > -1) game.inventory.splice(index, 1);
      console.log("🧪 Ты выпил зелье. Полегчало!");
    } else {
      console.log("❌ У тебя нет зелья!");
    }
  } else if (choice === "3") {
    if (game.inventory.includes(ITEMS.BOMB)) {
      game.currentEnemy.takeDamage(50);
      const index = game.inventory.indexOf(ITEMS.BOMB);
      if (index > -1) game.inventory.splice(index, 1);
      console.log("💣 БА-БАХ! Врагу очень больно.");
    } else {
      console.log("❌ У тебя нет бомбы!");
    }
  } else if (choice === "4") {
    console.log("👋 Игра окончена. Пока!");
    rl.close();
    return;
  } else {
    console.log("⚠️ Непонятная команда. Давай по новой.");
  }

  // Проверка на победу/поражение
  if (game.currentEnemy.hp <= 0) {
    console.log("\n🎉 ВРАГ ПОВЕРЖЕН! ПОБЕДА! 🎉");
    rl.close();
    return;
  }

  // Ответный удар врага (симуляция)
  console.log("\n🔻 Ход врага...");
  game.hero.takeDamage(20);
  console.log(`Враг ударил тебя! Твое HP: ${game.hero.hp}`);

  if (game.hero.hp <= 0) {
    console.log("\n💀 ТЫ ПОГИБ... R.I.P.");
    rl.close();
  } else {
    // Если все живы — спрашиваем снова
    askQuestion();
  }
};

// ЗАПУСК ЦИКЛА
askQuestion();
