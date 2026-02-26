"use strict";

import { Game } from "./Game.js";
import { ITEMS, GAME_STATE } from "./constants.js";
import { SETTINGS } from "./constants.js";
import {
  apiHealHero,
  apiLoadGame,
  apiSaveGame,
  apiUseItem,
  apiGenerateLoot,
  apiLevelUp,
  apiEnemyAttack,
  apiResetHero,
  apiSyncEnemy,
  apiHit,
  apiBuyItem,
  apiFetchEnemies,
  apiSellItem,
} from "./network.js";

const myBtn = document.querySelector("#attack-btn");
const mySpan = document.querySelector("#enemy-hp");
const myP = document.querySelector("#log");
const myHpBar = document.querySelector("#hp-bar");
const myRestart = document.querySelector("#restart-btn");
const myUl = document.querySelector("#inventory-list");
const enemySelect = document.querySelector("#enemy-select");
const enemyImg = document.querySelector("#enemy-img");
const lvlIndicator = document.querySelector("#game-level");
const myResStat = document.querySelector("#reset-btn");
const buyBtn = document.querySelector("#buy-bomb-btn");
const loadingScreen = document.querySelector("#loading-screen");
const gameApp = document.querySelector("#game-app");
const heroHp = document.querySelector("#hero-hp");
const heroHpBar = document.querySelector("#hero-hp-bar");
const heroWeapons = document.querySelector("#hero-weapons");
const goldBalance = document.querySelector("#gold-balance");
const buyHSwordBtn = document.querySelector("#but-heavy-sword-btn");
const sellBtn = document.querySelector("#sell-mode-btn");

let regenTimer; // Таймер регена врага на 5% от макс хп
let isSellMode = false; // Состояние для продажи вещей

const game = new Game();

// Обая функция логов
const logMessage = (text, color = "black", fontWeight = "normal") => {
  const time = new Date().toLocaleTimeString();
  const newLog = `[${time}] ${text}`;

  myP.innerHTML =
    `<div style='color: ${color}; font-weight: ${fontWeight}'>${newLog}</div>` +
    myP.innerHTML;

  // Ограничение строк в логе
  const maxLogs = 5;

  while (myP.children.length > maxLogs) {
    myP.removeChild(myP.lastChild);
  }
};

// Жизни и бар хп героя
const updateHeroUI = () => {
  heroHp.innerText = game.hero.hp;

  heroWeapons.innerText = `${game.hero.equippedWeapons}/${game.hero.maxHands}`;

  goldBalance.innerText = game.hero.gold;

  const hpPercent = Math.max(0, (game.hero.hp / game.hero.maxHp) * 100);
  heroHpBar.style.width = `${hpPercent}%`;
};

// --- ФУНКЦИЯ ИНВЕНТАРЯ ---
const renderInventory = () => {
  myUl.innerHTML = "";

  game.inventory.forEach((item, index) => {
    const newLi = document.createElement("li");
    newLi.innerText = item;
    newLi.style.cursor = "pointer";

    newLi.addEventListener("click", async () => {
      if (game.isProccessingTurn) {
        console.log("Enemy is atttacking. BE READY!");
        return;
      }

      if (
        game.state !== GAME_STATE.PLAYING &&
        game.state !== GAME_STATE.VICTORY
      ) {
        console.log(
          "Game is over, you cannot do anything with your inventory.",
        );
        return;
      }

      if (isSellMode) {
        try {
          const data = await apiSellItem(index); // Вызываем апи по индексу предмета

          if (data.success) {
            game.inventory.length = 0;
            game.inventory.push(...data.inventory);

            game.hero.gold = data.goldLeft;

            logMessage(`Server: ${data.message}`, "#00de1a");

            renderInventory();
            updateHeroUI();
            await saveGame();
          } else {
            logMessage(data.message, "red");
          }
        } catch (e) {
          console.error("Failed to sell item: ", e);
        }
      } else {
        try {
          const data = await apiUseItem(index);

          if (data.success) {
            game.inventory.length = 0;
            game.inventory.push(...data.inventory);

            game.hero.hp = data.heroStats.hp;
            game.hero.maxHp = data.heroStats.maxHp;
            game.hero.damage = data.heroStats.damage;
            game.hero.gold = data.heroStats.gold;
            game.hero.equippedWeapons = data.heroStats.equippedWeapons;
            game.currentEnemy.hp = data.enemyHpLeft;

            logMessage(
              `Server: ${data.message}`,
              data.itemUsed === ITEMS.BOMB ? "red" : "purple",
            );

            if (data.itemUsed === ITEMS.BOMB) {
              if (data.isEnemyDead) {
                handleVictory();
              } else {
                game.isProccessingTurn = true;
                toggleControls(true);

                setTimeout(async () => {
                  await enemyAttack();
                  game.isProccessingTurn = false;

                  if (
                    game.state === GAME_STATE.PLAYING ||
                    game.state === GAME_STATE.VICTORY
                  ) {
                    toggleControls(false);
                    if (game.state === GAME_STATE.VICTORY)
                      myBtn.disabled = true;
                  } else {
                    toggleControls(false);
                    myBtn.disabled = true;
                    buyBtn.disabled = true;
                  }
                  saveGame();
                }, SETTINGS.ENEMY_TURN_DELAY);
              }
            }

            updateHeroUI();
            renderInventory();

            mySpan.innerText = game.currentEnemy.hp;
            const barWidth =
              (game.currentEnemy.hp / (game.currentEnemy.maxHp * game.level)) *
              100;
            myHpBar.style.width = `${barWidth}%`;

            if (data.itemUsed !== ITEMS.BOMB) saveGame();
          } else {
            logMessage(data.message, "red");
          }
        } catch (e) {
          console.error("Failed to use item on server: ", e);
        }
      }
    });
    myUl.appendChild(newLi);
  });
};

// Функционал выпадения предметов
const dropLoot = async () => {
  try {
    const data = await apiGenerateLoot();

    game.inventory.length = 0;
    game.inventory.push(...data.inventory);
    game.hero.gold = data.gold;

    logMessage(`Server: ${data.message}`, "purple");

    renderInventory();
    updateHeroUI();
  } catch (e) {
    console.error("Loot generation failed: ", e);
  }
};

// Функция победы (чтобы не писать это всё много раз снова и снова)
const handleVictory = async () => {
  game.currentEnemy.hp = 0;
  mySpan.innerText = 0;
  mySpan.style.color = "red";
  myBtn.disabled = true;
  myBtn.style.color = "#BBBBBB";
  logMessage("Enemy is dead. Victory!", "blue", "bold");
  myHpBar.style.width = "0%";
  clearInterval(regenTimer);

  try {
    await dropLoot();

    const newLevel = game.level + 1;
    const newMaxHp = game.hero.maxHp + SETTINGS.LEVEL_UP_HP;
    const newHp = game.hero.hp + SETTINGS.LEVEL_UP_HP;
    const newDamage = game.hero.damage + SETTINGS.LEVEL_UP_DAMAGE;

    const data = await apiLevelUp(newMaxHp, newHp, newDamage);

    console.log("Server sync: ", data.message);

    game.state = GAME_STATE.VICTORY;
    game.level = newLevel;
    lvlIndicator.innerText = game.level;

    game.hero.hp = newHp;
    game.hero.maxHp = newMaxHp;
    game.hero.damage = newDamage;

    updateHeroUI();

    logMessage(`Level up! Current level: ${game.level}`, "black");
    logMessage(
      `Stats up: +${SETTINGS.LEVEL_UP_HP} HP, +${SETTINGS.LEVEL_UP_DAMAGE} DMG`,
      "blue",
    );
    logMessage(
      `Total stats: HP: ${game.hero.maxHp}, Damage: ${game.hero.damage}`,
    );

    await saveGame();
  } catch (e) {
    console.error("Level up sync failed: ", e);
    logMessage(
      "Network error: failed to sync victory. Progress might not be saved.",
      "red",
      "bold",
    );
  }
};

const enemyAttack = async () => {
  // Увеличение урона врага на 20% за 1 лвл
  try {
    const data = await apiEnemyAttack(game.level);

    game.hero.hp = data.heroHpLeft;
    updateHeroUI();

    logMessage(
      `Enemy hits you for ${data.damageDealt} damage! (Crit level: ${data.critLevel}x)`,
      "red",
    );

    if (game.hero.hp <= 0) {
      game.hero.hp = 0;
      game.state = GAME_STATE.GAME_OVER;

      myBtn.disabled = true;
      myBtn.style.color = "#BBB";
      logMessage("You died... Game over.", "red", "bold");
      clearInterval(regenTimer);
    }
  } catch (e) {
    console.error("Server unavailable. Enemy missed.", "red");
  }
};

const resetProgress = async () => {
  try {
    const data = await apiResetHero();

    game.reset();
    lvlIndicator.innerText = game.level;

    console.log(data.message);
  } catch (e) {
    console.error("Failed to reset on server.", e);
  }

  await saveGame(); // await тут конкретно необязательно писать (он выполниться в любом случае, поскольку функция async), но пусть лучше будет
  initGame();
};

const initGame = async () => {
  game.state = GAME_STATE.PLAYING;

  game.isProccessingTurn = false;

  // Если у героя хп 0 или меньше - хилим полностью
  if (game.hero.hp <= 0) {
    game.hero.hp = game.hero.maxHp;

    try {
      const data = await apiHealHero();

      console.log(data.message);
    } catch (e) {
      console.error("Failed to heal a hero on server. Reason: ", e);
    }
  }

  updateHeroUI();

  game.currentEnemy.hp = Math.floor(game.currentEnemy.maxHp * game.level);

  try {
    const data = await apiSyncEnemy(
      game.currentEnemy.name,
      game.currentEnemy.hp,
      game.currentEnemy.damage,
    );

    console.log("Synchronization: ", data.message);
  } catch (e) {
    console.error("Sync failed: ", e);
  }

  toggleControls(false);

  mySpan.innerText = game.currentEnemy.hp;
  myBtn.disabled = false;
  myBtn.style.color = "";

  logMessage("New game started...", "black");

  myHpBar.style.width = "100%";

  mySpan.style.color = "";
  enemyImg.src = game.currentEnemy.img;
  heroHp.innerText = game.hero.hp;

  clearInterval(regenTimer);

  regenTimer = setInterval(() => {
    const currentMaxHp = game.currentEnemy.maxHp * game.level;

    if (game.currentEnemy.hp > 0 && game.currentEnemy.hp < currentMaxHp) {
      game.currentEnemy.hp += Math.floor(
        currentMaxHp * SETTINGS.ENEMY_REGEN_PERCENT,
      );

      if (game.currentEnemy.hp > currentMaxHp)
        game.currentEnemy.hp = currentMaxHp;
      // Обновляем HTML после лечения
      mySpan.innerText = game.currentEnemy.hp;
      const barWidth = (game.currentEnemy.hp / currentMaxHp) * 100;
      myHpBar.style.width = `${barWidth}%`;
    }
  }, 3000);

  renderInventory();
};

// Функция для блокировки интерфейса кнопок
const toggleControls = (isDisabled) => {
  myBtn.disabled = isDisabled;
  buyBtn.disabled = isDisabled;
  enemySelect.disabled = isDisabled;
  myResStat.disabled = isDisabled;
  myRestart.disabled = isDisabled;
  buyHSwordBtn.disabled = isDisabled;

  myBtn.style.color = isDisabled ? "#BBB" : "";
  buyBtn.style.color = isDisabled ? "#BBB" : "";
  myResStat.style.color = isDisabled ? "#BBB" : "";
  myRestart.style.color = isDisabled ? "#BBB" : "";
  buyHSwordBtn.style.color = isDisabled ? "#BBB" : "";
};

myBtn.addEventListener("click", async () => {
  if (game.isProccessingTurn) return;

  try {
    const data = await apiHit();

    logMessage(
      `Server: ${data.message} (Damage: ${data.damageDealt}, Enemy HP: ${data.enemyHpLeft})`,
      "purple",
      "bold",
    );

    game.currentEnemy.hp = data.enemyHpLeft;

    const isCrit = data.isCrit;

    if (game.currentEnemy.hp <= 0) {
      handleVictory();
    } else {
      mySpan.innerText = game.currentEnemy.hp;
      logMessage(
        `You hit the enemy! Your damage: ${data.damageDealt}`,
        isCrit ? "red" : "black",
        isCrit ? "bold" : "normal",
      );

      const percNewEnemyHp =
        (game.currentEnemy.hp / (game.currentEnemy.maxHp * game.level)) * 100;
      myHpBar.style.width = `${percNewEnemyHp}%`;

      game.isProccessingTurn = true;
      toggleControls(true);

      logMessage("Enemy is preparing to attack. Defend yourself!", "grey");

      setTimeout(async () => {
        await enemyAttack();

        game.isProccessingTurn = false;

        if (
          game.state === GAME_STATE.PLAYING ||
          game.state === GAME_STATE.VICTORY
        ) {
          toggleControls(false);

          if (game.state === GAME_STATE.VICTORY) {
            myBtn.disabled = true;
            myBtn.style.color = "#BBB";
          }
        } else {
          toggleControls(false);

          myBtn.disabled = true;
          buyBtn.disabled = true;
        }

        saveGame();
      }, SETTINGS.ENEMY_TURN_DELAY);
    }
  } catch (e) {
    console.error(e);
    logMessage("Server unavailable. Play offline.", "red");
  }
});

myRestart.addEventListener("click", initGame);

myResStat.addEventListener("click", resetProgress);

buyHSwordBtn.addEventListener("click", async () => {
  if (game.state !== GAME_STATE.PLAYING && game.state !== GAME_STATE.VICTORY)
    return;

  try {
    const data = await apiBuyItem(ITEMS.HSWORD);

    if (data.success) {
      game.hero.gold = data.goldLeft;
      game.inventory.length = 0;
      game.inventory.push(...data.inventory);

      renderInventory();
      updateHeroUI();
      logMessage(
        `Server: ${data.message}. Balance: ${game.hero.gold}.`,
        "purple",
      );
      saveGame();
    } else {
      logMessage(`Server: ${data.message}.`, "purple");
    }
  } catch (e) {
    console.error("Shop is closed: ", e);
  }
});

buyBtn.addEventListener("click", async () => {
  if (game.state !== GAME_STATE.PLAYING && game.state !== GAME_STATE.VICTORY) {
    console.log("Game is over, you cannot do anything with your inventory.");
    return;
  }

  try {
    const data = await apiBuyItem(ITEMS.BOMB);

    if (data.success) {
      game.hero.gold = data.goldLeft;
      game.inventory.length = 0;
      game.inventory.push(...data.inventory);

      renderInventory();
      logMessage(
        `Server: ${data.message}. Balance: ${game.hero.gold}`,
        "purple",
      );
      saveGame();
    } else {
      logMessage(`Server: ${data.message}`, "purple");
    }
  } catch (e) {
    console.error("Shop is closed (Server unavailable): ", e);
  }
});

sellBtn.addEventListener("click", () => {
  isSellMode = !isSellMode;

  if (isSellMode) {
    sellBtn.innerText = "Sell Mode: ON";
    sellBtn.style.backgroundColor = "#00de1a";
  } else {
    sellBtn.innerText = "Sell Mode: OFF";
    sellBtn.style.backgroundColor = "";
  }
});

// Выбор врага
enemySelect.addEventListener("change", () => {
  const enemyIndex = parseInt(enemySelect.value);

  game.currentEnemy = game.enemies[enemyIndex];

  initGame();
});

// Сохранение игры на локальный диск
const saveGame = async () => {
  const payload = {
    level: game.level,
    inventory: game.inventory,
    gold: game.hero.gold,
  };

  try {
    const data = await apiSaveGame(payload);
    console.log("Server save: ", data.message);
  } catch (e) {
    console.error("Failed to save game to the server: ", e);
  }
};

const loadGame = async () => {
  try {
    const data = await apiLoadGame();

    game.level = data.level;
    lvlIndicator.innerText = game.level;

    game.inventory.length = 0;
    game.inventory.push(...data.inventory);

    game.hero.hp = data.heroStats.hp;
    game.hero.maxHp = data.heroStats.maxHp;
    game.hero.damage = data.heroStats.damage;
    game.hero.gold = data.heroStats.gold;
    game.hero.equippedWeapons = data.heroStats.equippedWeapons || 0;

    console.log("Game loaded successfully.");
  } catch (e) {
    console.error("Failed to load game from server.", e);
  }
};

const startApp = async () => {
  try {
    loadingScreen.style.display = "flex";

    game.enemies = await apiFetchEnemies();

    game.currentEnemy = game.enemies[0];

    loadingScreen.style.display = "none";
    gameApp.style.display = "block"; // тут мы игру начинаем, блокируем её, то биш начинаем

    await loadGame();

    if (!game.currentEnemy) game.currentEnemy = game.enemies[0];

    initGame();
  } catch (e) {
    console.error(e);

    loadingScreen.innerText = "Error while game loading. Please refresh page.";
    loadingScreen.style.color = "limegreen";
  } finally {
    console.log("App initialization attempt finished.");
  }
};

startApp();
