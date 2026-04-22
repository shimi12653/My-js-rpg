"use script";

import express from "express";
import cors from "cors";
import fs from "fs";
import { Game } from "./Game.js"; // 1. Импортируем нашу игру
import { Enemy } from "./Enemy.js"; // Чтобы не было ошибок с null
import {
  ADVANCED_WEAPONS,
  ARMOR_DATA,
  GAME_STATE,
  ITEMS,
  SETTINGS,
} from "./constants.js";
import {
  Weapon,
  FireStaff,
  Scythe,
  DualDaggers,
  Bow,
  Sword,
  CinderheartStaff,
  AbyssalSoulflameStaff,
  GrimOathblade,
  MoonlitExecutioner,
  SoulReaperScythe,
  GraveboundCrescent,
  HollowMaskDaggers,
  VeinrenderTwins,
  WhisperingBoneBow,
  AshenWraithLongbow,
} from "./weapon.js";
import { ENEMIES_DB } from "./enemies.js";
import { generateMap } from "./maps.js";

const app = express();
const PORT = 3000;

// Подключение CORS (возможность серверу брать информацию из другого источника. Источник как сервер, так и пк может быть)
app.use(cors());

// Учим сервер понимать json
app.use(express.json());

// Создаем игру один раз при запуске сервера
const myGame = new Game();

const mapWidth = SETTINGS.MAP_WIDTH;
const mapHeight = SETTINGS.MAP_HEIGHT;

const maxChests = SETTINGS.STARTING_CHESTS;
const maxEnemies = SETTINGS.STARTING_ENEMIES;

// --- Floor / dungeon progression state ---
myGame.floor = 1;
myGame.floorMeta = null; // stairsPos, keyHolderPos, bossPos
myGame.stairsUnlocked = false;
myGame.activeEnemyContext = null; // { role: 'key' | 'normal' }

const setupFloor = (floorNumber) => {
  myGame.floor = floorNumber;
  myGame.currentEnemy = null;
  myGame.state = GAME_STATE.PLAYING;
  myGame.activeEnemyContext = null;

  // Safe Zone: stairs unlocked by default.
  myGame.stairsUnlocked = floorNumber === 4;

  const chestCountForFloor = floorNumber === 5 ? 0 : maxChests;
  const enemyCountForFloor = floorNumber === 4 ? 0 : maxEnemies;

  const result = generateMap(
    mapWidth,
    mapHeight,
    0.4,
    chestCountForFloor,
    enemyCountForFloor,
    floorNumber,
  );

  myGame.map = result.map;
  myGame.hero.x = result.heroSpawn.x;
  myGame.hero.y = result.heroSpawn.y;

  myGame.floorMeta = {
    stairsPos: result.stairsPos,
    keyHolderPos: result.keyHolderPos,
    bossPos: result.bossPos,
  };

  myGame.discoveredMap = Array(mapHeight)
    .fill(0)
    .map(() => Array(mapWidth).fill(false));
  myGame.updateVision();
};

setupFloor(myGame.floor);

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
    myGame.hero.armor = savedData.heroStats.armor || 0;
    myGame.hero.equipment = savedData.heroStats.equipment || {
      head: null,
      chest: null,
      legs: null,
    };

    // Тут происходит приведение текста в массив оружия
    if (savedData.heroStats?.weapons) {
      myGame.hero.weapons = savedData.heroStats.weapons.map((savedWeapon) => {
        if (savedWeapon.name === "Wooden Sword") {
          return new Sword();
        } else if (savedWeapon.name === "Fire Staff") {
          return new FireStaff();
        } else if (savedWeapon.name === "Dual Daggers") {
          return new DualDaggers();
        } else if (savedWeapon.name === "Iron Scythe") {
          return new Scythe();
        } else if (savedWeapon.name === "Wooden Bow") {
          return new Bow();

          // --- новые посохи ---
        } else if (savedWeapon.name === "Cinderheart Pyre Staff") {
          return new CinderheartStaff();
        } else if (savedWeapon.name === "Abyssal Soulflame Staff") {
          return new AbyssalSoulflameStaff();

          // --- новые мечи ---
        } else if (savedWeapon.name === "Grim Oathblade") {
          return new GrimOathblade();
        } else if (savedWeapon.name === "Moonlit Executioner") {
          return new MoonlitExecutioner();

          // --- новые косы ---
        } else if (savedWeapon.name === "Soul Reaper Scythe") {
          return new SoulReaperScythe();
        } else if (savedWeapon.name === "Gravebound Crescent") {
          return new GraveboundCrescent();

          // --- новые кинжалы ---
        } else if (savedWeapon.name === "Hollow Mask Daggers") {
          return new HollowMaskDaggers();
        } else if (savedWeapon.name === "Veinrender Twins") {
          return new VeinrenderTwins();

          // --- новые луки ---
        } else if (savedWeapon.name === "Whispering Bone Bow") {
          return new WhisperingBoneBow();
        } else if (savedWeapon.name === "Ashen Wraith Longbow") {
          return new AshenWraithLongbow();
        } else {
          // И с любым другим видом оружия
          return new Weapon(
            savedWeapon.name,
            savedWeapon.baseDamage,
            savedWeapon.handsRequired,
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

// Дефолтный враг
if (!myGame.currentEnemy) {
  const template = ENEMIES_DB["goblin"];

  myGame.currentEnemy = new Enemy(
    template.name,
    template.hp,
    template.damage,
    template.img,
  );
}

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

// Система дропа
app.get("/generate-loot", (req, res) => {
  let droppedItem = null;
  let message = "No loot found.";

  const commonLoot = [ITEMS.POTION, ITEMS.MANA_POTION, ITEMS.GOLD];
  const rareLoot = [
    ITEMS.SWORD,
    ITEMS.BOW,
    ITEMS.DUAL_DAGGERS,
    ITEMS.STAFF,
    ITEMS.SCYTHE,
    "Leather Armor",
    "Leather Helmet",
    "Leather Pants",
  ];
  const epicLoot = Object.values(ADVANCED_WEAPONS).map((w) => w.name); // Хэш-таблицу превращаем в массив при помощи values и через мар ищем оружия по названию

  const roll = Math.random();

  // Рандом выпадения оружия (30% на коммонку, 25% на рарку, 5 - епик. 40% на ничего)
  if (roll < 0.4) {
    message = "No loot found";
  } else if (roll < 0.7) {
    const randomItem = Math.floor(Math.random() * commonLoot.length);
    droppedItem = commonLoot[randomItem];
  } else if (roll < 0.95) {
    const randomItem = Math.floor(Math.random() * rareLoot.length);
    droppedItem = rareLoot[randomItem];
  } else {
    const randomItem = Math.floor(Math.random() * epicLoot.length);
    droppedItem = epicLoot[randomItem];
  }

  // Проверка на золото
  if (droppedItem === ITEMS.GOLD) {
    myGame.hero.gold += SETTINGS.GOLD_DROP;

    message = `You found a ${ITEMS.GOLD}! +${SETTINGS.GOLD_DROP} coins.`;
  } else if (droppedItem !== null) {
    myGame.inventory.push(droppedItem);

    message = `Enemy dropped a ${droppedItem}.`;
  }

  res.json({
    message: message,
    loot: droppedItem,
    inventory: myGame.inventory,
    gold: myGame.hero.gold,
  });
});

// Метод атаки (враг и герой)
app.get("/enemy-attack", (req, res) => {
  let burnMessage = "";
  let isDodged = false;
  let takenDamageDealt = 0;

  if (myGame.currentEnemy.burnTurns > 0) {
    myGame.currentEnemy.takeDamage(myGame.currentEnemy.burnDamage);
    myGame.currentEnemy.burnTurns--;
    burnMessage = `Enemy burns for ${myGame.currentEnemy.burnDamage} damage! Enemy will take damage ${myGame.currentEnemy.burnTurns} turns more.`;
  }

  if (myGame.currentEnemy.hp <= 0) {
    return res.json({
      message: "The enemy was burned before it could strike you.",
      damageDealt: 0,
      heroHpLeft: myGame.hero.hp,
      enemyHpLeft: 0,
      critLevel: "0.0",
      burnMessage: burnMessage,
      isEnemyDead: true, // Для фронта, чтобы та часть игры знала, что враг умер
    });
  }

  const currentLevel = parseInt(req.query.level) || 1;

  const ENEMY_LEVEL_MULTI = 0.2;

  const levelMultiplier = 1 + currentLevel * ENEMY_LEVEL_MULTI;
  let scaledDamage = Math.floor(myGame.currentEnemy.damage * levelMultiplier);

  // Проверка на уклонение
  for (const wpn of myGame.hero.weapons) {
    if (wpn.dodgeChance) {
      if (Math.random() < wpn.dodgeChance) {
        isDodged = true;
        break;
      }
    }
  }

  if (!isDodged) {
    takenDamageDealt = myGame.hero.takeDamage(scaledDamage);
  }

  res.json({
    message: "The enemy has struck back!",
    damageDealt: takenDamageDealt,
    heroHpLeft: myGame.hero.hp,
    enemyHpLeft: myGame.currentEnemy.hp,
    critLevel: levelMultiplier.toFixed(1),
    burnMessage: burnMessage,
    isDodged: isDodged,
  });
});

// Список врагов для фронта
app.get("/enemies", (req, res) => {
  res.json(ENEMIES_DB);
});

app.get("/hit", (req, res) => {
  const hasStaff = myGame.hero.weapons.some((wpn) => wpn.burnChance);

  if (hasStaff) {
    if (myGame.hero.mana >= SETTINGS.STAFF_MANA_COST) {
      myGame.hero.mana -= SETTINGS.STAFF_MANA_COST;
    } else {
      return res.json({
        success: false,
        message: "Not enough mana to use Fire Staff.",
        enemyHpLeft: myGame.currentEnemy.hp,
      });
    }
  }

  let pureHeroDamage = myGame.hero.damage;

  // РАСЧЁТ УРОНА ГОЛЫМИ РУКАМИ. НЕ ТРОГАТЬ!
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

  let totalDrain = 0;

  let hasDoubleStrike = false;

  // Проверки на доп эффекты и другие
  for (const wpn of myGame.hero.weapons) {
    const hitResult = wpn.calcDamage();

    totalDamage += hitResult.damage;

    // Проверка на двойной удар
    if (hitResult.isDoubleStrike) {
      hasDoubleStrike = true;
    }

    // Логика горения (посох)
    if (hitResult.effect === "burn") {
      myGame.currentEnemy.burnTurns = 4;
    }

    if (hitResult.isCrit) {
      isAnyCrit = true;
    }

    // Логика вампиризма (коса)
    if (hitResult.drain) {
      totalDrain += hitResult.drain;
      myGame.hero.heal(hitResult.drain);
    }
  }

  myGame.currentEnemy.takeDamage(totalDamage);

  res.json({
    success: true,
    message: isAnyCrit ? "Critical hit!" : "Regular hit.",
    damageDealt: totalDamage,
    manaLeft: myGame.hero.mana,
    isCrit: isAnyCrit,
    enemyHpLeft: myGame.currentEnemy.hp,
    heroHpLeft: myGame.hero.hp,
    drainAmount: totalDrain,
    isDoubleStrike: hasDoubleStrike,
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

// Преедвижение на сервере
app.get("/move", (req, res) => {
  // Проверка боя (нельзя убежать)
  if (myGame.state === GAME_STATE.BATTLE) {
    return res.json({
      success: false,
      message: "No way go back. Fight!",
    });
  }

  const direction = req.query.dir;
  const validDir = ["north", "south", "east", "west"];

  if (!validDir.includes(direction)) {
    return res.json({
      success: false,
      message: `Invalid direction.`,
    });
  }

  let nextX = myGame.hero.x;
  let nextY = myGame.hero.y;

  if (direction === "north") nextY -= 1;
  if (direction === "south") nextY += 1;
  if (direction === "east") nextX += 1;
  if (direction === "west") nextX -= 1;

  // Ограничиваем провал в бездну
  if (
    nextY < 0 ||
    nextX < 0 ||
    nextY >= myGame.map.length ||
    nextX >= myGame.map[0].length
  ) {
    return res.json({
      success: false,
      message: "You reached the edge of the world. Around only dark abyss...",
      currentPosition: { x: myGame.hero.x, y: myGame.hero.y },
    });
  }

  const isThatWall = myGame.map[nextY][nextX];

  if (isThatWall === 0) {
    return res.json({
      success: false,
      message: "There is a wall ahead of you.",
      currentPosition: { x: myGame.hero.x, y: myGame.hero.y },
    });
  } else if (isThatWall === 2) {
    // Сундук на карте
    myGame.hero.addGold(150);

    myGame.hero.x = nextX;
    myGame.hero.y = nextY;

    myGame.map[nextY][nextX] = 1; // Сундук становится обычной клеткой

    myGame.updateVision();

    return res.json({
      success: true,
      message: "You found a chest with gold! +150 coins to your balance.",
      goldLeft: myGame.hero.gold,
    });
  } else if (isThatWall === 4) {
    // STAIRS_DOWN interaction: locked by default, unlocked after key-holder death
    myGame.hero.x = nextX;
    myGame.hero.y = nextY;
    myGame.updateVision();

    if (!myGame.stairsUnlocked) {
      return res.json({
        success: true,
        message: "The stairs are locked. Find the Dungeon Key!",
        currentPosition: { x: myGame.hero.x, y: myGame.hero.y },
      });
    }

    const nextFloor = myGame.floor + 1;
    setupFloor(nextFloor);

    return res.json({
      success: true,
      message: `You descend to Floor ${nextFloor}.`,
      currentFloor: nextFloor,
    });
  } else if (isThatWall === 3) {
    myGame.hero.x = nextX;
    myGame.hero.y = nextY;

    myGame.map[nextY][nextX] = 1;

    myGame.state = GAME_STATE.BATTLE;

    const isBoss =
      myGame.floorMeta?.bossPos &&
      nextX === myGame.floorMeta.bossPos.x &&
      nextY === myGame.floorMeta.bossPos.y;

    const isKeyHolder =
      myGame.floorMeta?.keyHolderPos &&
      nextX === myGame.floorMeta.keyHolderPos.x &&
      nextY === myGame.floorMeta.keyHolderPos.y;

    myGame.activeEnemyContext = {
      role: isKeyHolder ? "key" : "normal",
      isBoss: Boolean(isBoss),
    };

    let template = null;
    if (isBoss) {
      template = ENEMIES_DB.dragon;

      // Boss stats: significantly higher than a normal dragon
      const bossHp = Math.floor(template.hp * 2 + myGame.floor * 120);
      const bossDamage = Math.floor(template.damage * 2 + myGame.floor * 20);

      myGame.currentEnemy = new Enemy(
        template.name,
        bossHp,
        bossDamage,
        template.img,
      );
    } else {
      const availableEnemies = Object.values(ENEMIES_DB).filter((enemy) => {
        if (enemy.isBoss === false && enemy.tier <= myGame.floor) {
          return true;
        } else {
          return false;
        }
      });

      /* 2 версия
      const availableEnemies = Object.values(ENEMIES_DB).filter(enemy => !enemy.isBoss && enemy.tier <= myGame.floor)
      Без return. Return спереди мы не пишем, если нету фигурных скобок. Если их нету - убери просто ретурн. Язык сам сделает его неявно
      */

      const randomIndex = Math.floor(Math.random() * availableEnemies.length);

      template = availableEnemies[randomIndex];

      myGame.currentEnemy = new Enemy(
        template.name,
        template.hp,
        template.damage,
        template.img,
      );
    }

    myGame.updateVision();

    return res.json({
      success: true,
      message: isBoss
        ? "A hellish Dragon steps forth to block your descent!"
        : isKeyHolder
          ? `A wild ${template.name} carries the Dungeon Key!`
          : `A wild ${template.name} jumps out of the shadows!`,
      battleStarted: true,
      currentEnemy: myGame.currentEnemy,
    });
  } else if (isThatWall === 5) {
    return res.json({
      success: false,
      message: `Merchant: 'Got some rare things on sale, stranger! Check your shop panel.'`,
      currentPosition: { x: myGame.hero.x, y: myGame.hero.y },
    });
  } else if (isThatWall === 6) {
    myGame.hero.hp = myGame.hero.maxHp;
    myGame.hero.mana = myGame.hero.maxMana;

    myGame.hero.x = nextX;
    myGame.hero.y = nextY;

    myGame.updateVision();

    return res.json({
      success: true,
      message: "You drink from the Holy Fountain. HP and Mana fully restored!",
      heroStats: myGame.hero,
    });
  }

  myGame.hero.x = nextX;
  myGame.hero.y = nextY;

  myGame.updateVision();

  res.json({
    success: true,
    message: `You moved ${direction}.`,
    currentPosition: { x: myGame.hero.x, y: myGame.hero.y },
  });
});

app.get("/map", (req, res) => {
  res.json({
    map: myGame.map,
    heroX: myGame.hero.x,
    heroY: myGame.hero.y,
    discoveredMap: myGame.discoveredMap,
  });
});

// Операции со статистикой героя (исцеление, сброс и повышение уровня)
app.get("/heal-hero", (req, res) => {
  myGame.hero.hp = myGame.hero.maxHp;
  myGame.state = GAME_STATE.PLAYING;

  res.json({
    message: "Hero was healed on server.",
    heroHp: myGame.hero.hp,
  });
});

app.get("/reset-hero", (req, res) => {
  myGame.state = GAME_STATE.PLAYING;
  myGame.currentEnemy = null;

  myGame.hero.hp = 100;
  myGame.hero.maxHp = 100;
  myGame.hero.damage = 5;
  myGame.hero.equippedWeapons = 0;
  myGame.hero.gold = 0;
  myGame.hero.mana = SETTINGS.HERO_MAX_MANA;
  myGame.hero.weapons = []; // Очищаем массив при ресете
  myGame.hero.armor = 0;
  myGame.hero.equipment = { head: null, chesht: null, legs: null };

  setupFloor(1);

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

  myGame.state = GAME_STATE.PLAYING;

  // Key unlock: when the key-holder enemy dies, unlock STAIRS_DOWN
  let stairsMessage = "";
  if (
    myGame.activeEnemyContext?.role === "key" &&
    myGame.stairsUnlocked === false
  ) {
    myGame.stairsUnlocked = true;
    stairsMessage = " You found the Dungeon Key!";
    console.log("You found the Dungeon Key!");
  }

  myGame.activeEnemyContext = null;

  res.json({
    message: `Hero leveled up. Server wrote it.${stairsMessage}`,
    heroStats: myGame.hero,
    stairsUnlocked: myGame.stairsUnlocked,
  });
});

// Синхронизация фронт-энда и бэк-энда (враг и герой)
app.get("/sync", (req, res) => {
  const enemyKeys = Object.keys(ENEMIES_DB);
  const enemyIndex = parseInt(req.query.index) || 0;
  const template = ENEMIES_DB[enemyKeys[enemyIndex]];

  if (!template) {
    return res.json({
      success: false,
      message: "Enemy not found in database.",
    });
  }

  if (!myGame.currentEnemy) {
    myGame.currentEnemy = new Enemy(
      template.name,
      template.hp,
      template.damage,
      template.img,
    );
  } else {
    myGame.currentEnemy.name = template.name;
    myGame.currentEnemy.hp = template.hp;
    myGame.currentEnemy.maxHp = template.hp;
    myGame.currentEnemy.damage = template.damage;
    myGame.currentEnemy.img = template.img;
  }

  res.json({
    success: true,
    message: "Server authorized new enemy.",
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
  } else if (itemToBuy === ITEMS.STAFF) {
    if (myGame.hero.gold >= SETTINGS.STAFF_COST) {
      myGame.hero.gold -= SETTINGS.STAFF_COST;
      myGame.inventory.push(ITEMS.STAFF);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.STAFF} for ${SETTINGS.STAFF_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else if (itemToBuy === ITEMS.POTION) {
    if (myGame.hero.gold >= SETTINGS.POTION_COST) {
      myGame.hero.gold -= SETTINGS.POTION_COST;
      myGame.inventory.push(ITEMS.POTION);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.POTION} for ${SETTINGS.POTION_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else if (itemToBuy === ITEMS.MANA_POTION) {
    if (myGame.hero.gold >= SETTINGS.MANA_POTION_COST) {
      myGame.hero.gold -= SETTINGS.MANA_POTION_COST;
      myGame.inventory.push(ITEMS.MANA_POTION);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.MANA_POTION} for ${SETTINGS.MANA_POTION_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else if (itemToBuy === ITEMS.SCYTHE) {
    if (myGame.hero.gold >= SETTINGS.SCYTHE_COST) {
      myGame.hero.gold -= SETTINGS.SCYTHE_COST;
      myGame.inventory.push(ITEMS.SCYTHE);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.SCYTHE} for ${SETTINGS.SCYTHE_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else if (itemToBuy === ITEMS.DUAL_DAGGERS) {
    if (myGame.hero.gold >= SETTINGS.DUAL_DAGGERS_COST) {
      myGame.hero.gold -= SETTINGS.DUAL_DAGGERS_COST;
      myGame.inventory.push(ITEMS.DUAL_DAGGERS);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.DUAL_DAGGERS} for ${SETTINGS.DUAL_DAGGERS_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else if (itemToBuy === ITEMS.BOW) {
    if (myGame.hero.gold >= SETTINGS.BOW_COST) {
      myGame.hero.gold -= SETTINGS.BOW_COST;
      myGame.inventory.push(ITEMS.BOW);

      res.json({
        success: true,
        message: `You bought a ${ITEMS.BOW} for ${SETTINGS.BOW_COST} gold.`,
        goldLeft: myGame.hero.gold,
        inventory: myGame.inventory,
      });
    } else {
      res.json({
        success: false,
        message: `Not enough money, bucko. Your balance: ${myGame.hero.gold}`,
      });
    }
  } else if (ARMOR_DATA[itemToBuy]) {
    const armorCost = ARMOR_DATA[itemToBuy].cost;

    if (myGame.hero.gold >= armorCost) {
      myGame.hero.gold -= armorCost;
      myGame.inventory.push(itemToBuy);

      res.json({
        success: true,
        message: `You bought ${itemToBuy} for ${armorCost} gold.`,
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
// Использование предмета
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
    message = `You used a ${ITEMS.POTION}! +${SETTINGS.HEAL_AMOUNT} HP.`;
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
  } else if (item === ITEMS.SWORD) {
    const isEquipped = myGame.hero.equipWeapon(new Sword());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    }

    message = `You equipped ${ITEMS.SWORD}.`;
  } else if (item === ITEMS.STAFF) {
    const isEquipped = myGame.hero.equipWeapon(new FireStaff());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    }

    message = `You equipped ${ITEMS.STAFF}.`;
  } else if (item === ITEMS.SCYTHE) {
    const isEquipped = myGame.hero.equipWeapon(new Scythe());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    }

    message = `You equipped ${ITEMS.SCYTHE}.`;
  } else if (item === ITEMS.MANA_POTION) {
    if (myGame.hero.hp <= 0) {
      return res.json({
        success: false,
        message: `You are dead. You can't do anything.`,
      });
    }

    myGame.hero.mana += SETTINGS.MANA_RESTORE_COST;
    if (myGame.hero.mana >= myGame.hero.maxMana)
      myGame.hero.mana = myGame.hero.maxMana;
    message = `You used a ${ITEMS.MANA_POTION}. +${SETTINGS.MANA_RESTORE_COST} MP.`;
  } else if (item === ITEMS.DUAL_DAGGERS) {
    const isEquipped = myGame.hero.equipWeapon(new DualDaggers());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    }

    message = `You equipped ${ITEMS.DUAL_DAGGERS}.`;
  } else if (item === ITEMS.BOW) {
    const isEquipped = myGame.hero.equipWeapon(new Bow());

    if (!isEquipped) {
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    }

    message = `You equipped ${ITEMS.BOW}.`;
  } else if (ARMOR_DATA[item]) {
    const armorInfo = ARMOR_DATA[item]; // В этом случае мы используем [], потому что не знаем что пользователь захочет одеть. Если он клацнет на шлем - JS пойдёт в equipment, найдёт slot, увидит, что slot = head и подставит туда именно head. equipment['head'] и equipment.head равносильно в JS
    const slot = armorInfo.slot;

    if (myGame.hero.equipment[slot] !== null) {
      myGame.inventory.push(myGame.hero.equipment[slot]);
    }

    myGame.hero.equipment[slot] = item;

    myGame.hero.armor = 0;
    if (myGame.hero.equipment.head)
      myGame.hero.armor += ARMOR_DATA[myGame.hero.equipment.head].bonus;
    if (myGame.hero.equipment.chest)
      myGame.hero.armor += ARMOR_DATA[myGame.hero.equipment.chest].bonus;
    if (myGame.hero.equipment.legs)
      myGame.hero.armor += ARMOR_DATA[myGame.hero.equipment.legs].bonus;

    message = `You equipped ${item}. Total armor: ${myGame.hero.armor}.`;
  } else if (item === "Cinderheart Pyre Staff") {
    const isEquipped = myGame.hero.equipWeapon(new CinderheartStaff());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Cinderheart Pyre Staff.`;
  } else if (item === "Abyssal Soulflame Staff") {
    const isEquipped = myGame.hero.equipWeapon(new AbyssalSoulflameStaff());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Abyssal Soulflame Staff.`;

    // --- НОВЫЕ МЕЧИ ---
  } else if (item === "Grim Oathblade") {
    const isEquipped = myGame.hero.equipWeapon(new GrimOathblade());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Grim Oathblade.`;
  } else if (item === "Moonlit Executioner") {
    const isEquipped = myGame.hero.equipWeapon(new MoonlitExecutioner());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Moonlit Executioner.`;

    // --- НОВЫЕ КОСЫ ---
  } else if (item === "Soul Reaper Scythe") {
    const isEquipped = myGame.hero.equipWeapon(new SoulReaperScythe());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Soul Reaper Scythe.`;
  } else if (item === "Gravebound Crescent") {
    const isEquipped = myGame.hero.equipWeapon(new GraveboundCrescent());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Gravebound Crescent.`;

    // --- НОВЫЕ КИНЖАЛЫ ---
  } else if (item === "Hollow Mask Daggers") {
    const isEquipped = myGame.hero.equipWeapon(new HollowMaskDaggers());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Hollow Mask Daggers.`;
  } else if (item === "Veinrender Twins") {
    const isEquipped = myGame.hero.equipWeapon(new VeinrenderTwins());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Veinrender Twins.`;

    // --- НОВЫЕ ЛУКИ ---
  } else if (item === "Whispering Bone Bow") {
    const isEquipped = myGame.hero.equipWeapon(new WhisperingBoneBow());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Whispering Bone Bow.`;
  } else if (item === "Ashen Wraith Longbow") {
    const isEquipped = myGame.hero.equipWeapon(new AshenWraithLongbow());
    if (!isEquipped)
      return res.json({
        success: false,
        message: `You don't have enough free hands!`,
      });
    message = `You equipped Ashen Wraith Longbow.`;
  }

  myGame.inventory.splice(itemIndex, 1);

  res.json({
    success: true,
    itemUsed: item,
    message: message,
    isEnemyDead: isEnemyDead,
    inventory: myGame.inventory,
    heroStats: myGame.hero,
    enemyHpLeft: myGame.currentEnemy ? myGame.currentEnemy.hp : 0,
  });
});

// Снятие предмета с героя
app.get("/unequip-item", (req, res) => {
  const weaponIndex = parseInt(req.query.index);
  if (
    isNaN(weaponIndex) ||
    weaponIndex >= myGame.hero.weapons.length ||
    weaponIndex < 0
  ) {
    return res.json({
      success: false,
      message: "Weapon not found.",
    });
  }

  const weaponToUnequip = myGame.hero.weapons[weaponIndex];

  myGame.inventory.push(weaponToUnequip.name);
  myGame.hero.weapons.splice(weaponIndex, 1);
  myGame.hero.equippedWeapons -= weaponToUnequip.handsRequired;

  res.json({
    success: true,
    message: `You unequipped ${weaponToUnequip.name}.`,
    inventory: myGame.inventory,
    heroStats: myGame.hero,
  });
});

// Снятие брони с героя
app.get("/unequip-armor", (req, res) => {
  const slot = req.query.slot; // Получаем запрос какой слот будем снимать

  if (!slot || !myGame.hero.equipment[slot]) {
    // Проверка доступный ли слот и надето ли на герое что-то
    return res.json({
      success: false,
      message: "Slot is empty (or invalid).",
    });
  }

  const armorName = myGame.hero.equipment[slot]; // Чтобы было легче обращаться к броне

  myGame.inventory.push(armorName); // Вставляем в инвентарь

  myGame.hero.equipment[slot] = null; // Убираем с героя

  myGame.hero.armor = 0; // Обнуляем защиту и пересчитываем её сразу
  if (myGame.hero.equipment.head)
    myGame.hero.armor += ARMOR_DATA[myGame.hero.equipment.head].bonus;
  if (myGame.hero.equipment.chest)
    myGame.hero.armor += ARMOR_DATA[myGame.hero.equipment.chest].bonus;
  if (myGame.hero.equipment.legs)
    myGame.hero.armor += ARMOR_DATA[myGame.hero.equipment.legs].bonus;

  res.json({
    success: true,
    message: `You took off the ${armorName}.`,
    inventory: myGame.inventory,
    heroStats: myGame.hero,
  });
});

// Логика продажи инвентаря
app.get("/sell-item", (req, res) => {
  const itemIndex = parseInt(req.query.index);

  if (
    isNaN(itemIndex) ||
    itemIndex >= myGame.inventory.length ||
    itemIndex < 0
  ) {
    return res.json({
      success: false,
      message: "Item not found.",
    });
  }

  const item = myGame.inventory[itemIndex];
  let message = "";

  if (item === ITEMS.POTION) {
    myGame.hero.gold += SETTINGS.POTION_SELL_PRICE;
    message = `You sell a ${ITEMS.POTION} for ${SETTINGS.POTION_SELL_PRICE}.`;
  } else if (item === ITEMS.BOMB) {
    myGame.hero.gold += SETTINGS.BOMB_SELL_PRICE;
    message = `You sell a ${ITEMS.BOMB} for ${SETTINGS.BOMB_SELL_PRICE}.`;
  } else if (item === ITEMS.SWORD) {
    myGame.hero.gold += SETTINGS.SWORD_SELL_PRICE;
    message = `You sell a ${ITEMS.SWORD} for ${SETTINGS.SWORD_SELL_PRICE}.`;
  } else if (item === ITEMS.STAFF) {
    myGame.hero.gold += SETTINGS.STAFF_SELL_PRICE;
    message = `You sell a ${ITEMS.STAFF} for ${SETTINGS.STAFF_SELL_PRICE}.`;
  } else if (item === ITEMS.SCYTHE) {
    myGame.hero.gold += SETTINGS.SCYTHE_SELL_PRICE;
    message = `You sell a ${ITEMS.SCYTHE} for ${SETTINGS.SCYTHE_SELL_PRICE}.`;
  } else if (item === ITEMS.DUAL_DAGGERS) {
    myGame.hero.gold += SETTINGS.DUAL_DAGGERS_SELL_PRICE;
    message = `You sell a ${ITEMS.DUAL_DAGGERS} for ${SETTINGS.DUAL_DAGGERS_SELL_PRICE}.`;
  } else if (item === ITEMS.BOW) {
    myGame.hero.gold += SETTINGS.BOW_SELL_PRICE;
    message = `You sell a ${ITEMS.BOW} for ${SETTINGS.BOW_SELL_PRICE}.`;
  } else if (item === ITEMS.MANA_POTION) {
    myGame.hero.gold += SETTINGS.MANA_POTION_SELL_PRICE;
    message = `You sell a ${ITEMS.MANA_POTION} for ${SETTINGS.MANA_POTION_SELL_PRICE}.`;
  } else if (ARMOR_DATA[item]) {
    const sellPrice = Math.floor(ARMOR_DATA[item].cost / 3); // Продаём так, чтобы не писать постоянно cost и sell_price

    myGame.hero.gold += sellPrice;
    message = `You sold a ${item} for ${sellPrice} gold.`;
  }

  myGame.inventory.splice(itemIndex, 1);

  res.json({
    success: true,
    itemUsed: item,
    goldLeft: myGame.hero.gold,
    inventory: myGame.inventory,
    message: message,
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
      armor: myGame.hero.armor,
      equipment: myGame.hero.equipment,
    },
  };

  // Создание и запись во временную базу данных данных о герое
  fs.writeFileSync(DB, JSON.stringify(dataToSave, null, 2));

  res.json({ message: "Save successed." });
});

app.get("/load-game", (req, res) => {
  res.json({
    state: myGame.state,
    currentEnemy: myGame.currentEnemy,
    currentFloor: myGame.floor,
    level: myGame.level || 1,
    inventory: myGame.inventory || [],
    heroStats: {
      hp: myGame.hero.hp,
      maxHp: myGame.hero.maxHp,
      damage: myGame.hero.damage,
      gold: myGame.hero.gold,
      equippedWeapons: myGame.hero.equippedWeapons,
      weapons: myGame.hero.weapons,
      armor: myGame.hero.armor,
      equipment: myGame.hero.equipment,
    },
  });
});

app.listen(PORT, () => {
  console.log(`RPG Сервер запущен на http://localhost:${PORT}`);
});
