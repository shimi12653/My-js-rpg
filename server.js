"use script";

import express, { raw } from "express";
import cors from "cors";
import fs from "fs";
import { Game } from "./Game.js"; // 1. Импортируем нашу игру
import { Enemy } from "./Enemy.js"; // Чтобы не было ошибок с null
import { ITEMS, SETTINGS } from "./constants.js";
import { Weapon, Dagger, HSword } from "./weapon.js";

const app = express();
const PORT = 3000;

// Подключение CORS (возможность серверу брать информацию из другого источника. Источник как сервер, так и пк может быть)
app.use(cors());

// Учим сервер понимать json
app.use(express.json());

// Создаем игру один раз при запуске сервера
const myGame = new Game();

// Инициализация БД при старте сервера
const DB = "temporary_database.json";

//Проверка на наличие БД
if (fs.existsSync(DB)) {
  try {
    const rawData = fs.readFileSync(DB, "utf-8");

    const savedData = JSON.parse(rawData);

    myGame.level = savedData.level;
    myGame.inventory = savedData.inventory;
    myGame.hero.hp = savedData.heroStats.hp;
    myGame.hero.maxHp = savedData.heroStats.maxHp;
    myGame.hero.damage = savedData.heroStats.damage;
    myGame.hero.gold = savedData.heroStats.gold;
    myGame.hero.equippedWeapons = savedData.heroStats.equippedWeapons || 0;

    // Тут происходит приведение текста в массив оружия
    if (savedData.heroStats?.weapons) {
      myGame.hero.weapons = savedData.heroStats.weapons.map((savedWeapon) => {
        if (savedWeapon.name === "Rusty dagger") {
          // если название сохранённого оружия - 'Rusty dagger' ...
          return new Dagger(); // Возвращается класс Dagger
        } else if (savedWeapon.name === "Heavy sword") {
          return new HSword(); // Также и с Heavy sword
        } else {
          // И с любым другим видом оружия
          return new Weapon(
            savedWeapon.name,
            savedWeapon.baseDamage,
            savedData.handsRequired,
          );
        }
      });
    }

    console.log("Progress was successfully loaded from temporary database.");
  } catch (e) {
    console.error("Progress is not read. Error: ", e);
  }
} else {
  console.log("Database is not found.");
}

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

// система дропа
app.get("/generate-loot", (req, res) => {
  let droppedItem = null;
  let message = "No loot found.";

  if (Math.random() < 0.5) {
    const possibleLoot = [ITEMS.POTION, ITEMS.DAGGER, ITEMS.GOLD];
    droppedItem = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];

    if (droppedItem === ITEMS.GOLD) {
      myGame.hero.gold += SETTINGS.GOLD_DROP;
      message = `You found a ${ITEMS.GOLD} from enemy. You got ${SETTINGS.GOLD_DROP} gold!`;
    } else {
      myGame.inventory.push(droppedItem);
      message = `You found ${droppedItem} from enemy. Congratulations!`;
    }
  }

  res.json({
    message: message,
    loot: droppedItem,
    inventory: myGame.inventory,
    gold: myGame.hero.gold,
  });
});

// метод атаки (враг и герой)
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
  let pureHeroDamage = myGame.hero.damage;

  for (const wpn of myGame.hero.weapons) {
    pureHeroDamage -= wpn.baseDamage;
  }

  if (pureHeroDamage < 5) pureHeroDamage = 5;

  const variance = 0.2;
  const minHeroDamage = Math.ceil(pureHeroDamage * (1 - variance));
  const maxHeroDamage = Math.floor(pureHeroDamage * (1 + variance));

  let totalDamage =
    Math.floor(Math.random() * (maxHeroDamage - minHeroDamage + 1)) +
    minHeroDamage;

  let isAnyCrit = false;

  for (const wpn of myGame.hero.weapons) {
    const hitResult = wpn.calcDamage();

    totalDamage += hitResult.damage;

    if (hitResult.isCrit) {
      isAnyCrit = true;
    }
  }

  myGame.currentEnemy.takeDamage(totalDamage);

  res.json({
    success: true,
    message: isAnyCrit ? "Critical hit!" : "Regular hit.",
    damageDealt: totalDamage,
    isCrit: isAnyCrit,
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

// операции со статистикой героя (исцеление, сброс и повышение уровня)
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
  myGame.hero.damage = 5;
  myGame.hero.equippedWeapons = 0;
  myGame.hero.gold = 0;
  myGame.hero.weapons = []; // Очищаем массив при ресете

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

// синхронизация фронт-энда и бэк-энда (враг и герой)
app.get("/sync", (req, res) => {
  const syncEnemyHp = parseInt(req.query.hp) || 100;
  const syncEnemyName = req.query.name || "Unknown";
  const syncEnemyDamage = parseInt(req.query.damage) || 10;

  myGame.currentEnemy.hp = syncEnemyHp;
  myGame.currentEnemy.maxHp = syncEnemyHp;
  myGame.currentEnemy.name = syncEnemyName;
  myGame.currentEnemy.damage = syncEnemyDamage;

  res.json({
    message: "Server synchronized. New enemy ready to fight.",
    enemyStatus: myGame.currentEnemy,
  });
});

// Логика магазина
app.get("/buy-item", (req, res) => {
  const itemToBuy = req.query.item;

  if (itemToBuy === ITEMS.BOMB) {
    if (myGame.hero.gold >= SETTINGS.BOMB_COST) {
      myGame.hero.gold -= SETTINGS.BOMB_COST;
      myGame.inventory.push(ITEMS.BOMB);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.BOMB} for ${SETTINGS.BOMB_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}.`,
      });
    }
  } else if (itemToBuy === ITEMS.HSWORD) {
    if (myGame.hero.gold >= SETTINGS.HSWORD_COST) {
      myGame.hero.gold -= SETTINGS.HSWORD_COST;
      myGame.inventory.push(ITEMS.HSWORD);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.HSWORD} for ${SETTINGS.HSWORD_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else {
    res.json({
      success: false,
      message: "Item not found in shop.",
    });
  }
});

// Логика инвентаря
app.get("/use-item", (req, res) => {
  const itemIndex = parseInt(req.query.index);

  if (
    isNaN(itemIndex) ||
    itemIndex >= myGame.inventory.length ||
    itemIndex < 0
  ) {
    return res.json({
      success: false,
      message: "Item not found or already used.",
    });
  }

  const item = myGame.inventory[itemIndex];
  let message = "";
  let isEnemyDead = false;

  if (item === ITEMS.POTION) {
    if (myGame.hero.hp <= 0) {
      return res.json({
        success: false,
        message: `You are dead. You can't do anything.`,
      });
    }

    myGame.hero.hp += SETTINGS.HEAL_AMOUNT;
    if (myGame.hero.hp >= myGame.hero.maxHp) myGame.hero.hp = myGame.hero.maxHp;
    message = `You used a healing pation! +${SETTINGS.HEAL_AMOUNT} HP.`;
  } else if (item === ITEMS.DAGGER) {
    const isEquipped = myGame.hero.equipWeapon(new Dagger());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You can't pick more than ${myGame.hero.maxHands} swords.`,
      });
    }

    message = `You equipped ${ITEMS.DAGGER}.`;
  } else if (item === ITEMS.HSWORD) {
    const isEquipped = myGame.hero.equipWeapon(new HSword());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    }

    message = `You equipped ${ITEMS.HSWORD}.`;
  } else if (item === ITEMS.BOMB) {
    if (myGame.currentEnemy.hp <= 0) {
      return res.json({
        success: false,
        message: `Enemy is dead. Why do you need to use a bomb?`,
      });
    }

    myGame.currentEnemy.hp -= SETTINGS.BOMB_DAMAGE;

    if (myGame.currentEnemy.hp > 0) {
      message = `BOOM! -${SETTINGS.BOMB_DAMAGE} enemy hp.`;
    } else {
      message = `BOOM! Fatal damage. -${SETTINGS.BOMB_DAMAGE} enemy hp`;
      isEnemyDead = true;
    }
  } else if (item === ITEMS.GOLD) {
    myGame.hero.gold += SETTINGS.GOLD_DROP;
    message = `You used a bad of Gold! +${SETTINGS.GOLD_DROP} coins.`;
  }

  myGame.inventory.splice(itemIndex, 1);

  res.json({
    success: true,
    itemUsed: item,
    message: message,
    isEnemyDead: isEnemyDead,
    inventory: myGame.inventory,
    heroStats: myGame.hero,
    enemyHpLeft: myGame.currentEnemy.hp,
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

  const dataToSave = {
    level: myGame.level,
    inventory: myGame.inventory,
    heroStats: {
      hp: myGame.hero.hp,
      maxHp: myGame.hero.maxHp,
      damage: myGame.hero.damage,
      gold: myGame.hero.gold,
      equippedWeapons: myGame.hero.equippedWeapons,
      weapons: myGame.hero.weapons,
    },
  };

  // Создание и запись во временную базу данных данных о герое
  fs.writeFileSync(DB, JSON.stringify(dataToSave, null, 2));

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
      equippedWeapons: myGame.hero.equippedWeapons,
    },
  });
});

app.listen(PORT, () => {
  console.log(`RPG Сервер запущен на http://localhost:${PORT}`);
});
