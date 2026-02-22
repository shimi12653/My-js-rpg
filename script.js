"use strict";

import { Game } from "./Game.js";
import { ITEMS, GAME_STATE } from "./constants.js";
import { fetchEnemies } from "./api.js";
import { SETTINGS } from "./constants.js";

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

let regenTimer; // Таймер регена врага на 5% от макс хп

const game = new Game();

// Выбор врага
enemySelect.addEventListener("change", () => {
  const enemyIndex = parseInt(enemySelect.value);

  game.currentEnemy = game.enemies[enemyIndex];

  initGame();
});

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

      try {
        const responce = await fetch(
          `http://localhost:3000/use-item?index=${index}`,
        );
        const data = await responce.json();

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
                  if (game.state === GAME_STATE.VICTORY) myBtn.disabled = true;
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
    });
    myUl.appendChild(newLi);
  });
};

// Функционал выпадения предметов
const dropLoot = async () => {
  try {
    const response = await fetch("http://localhost:3000/generate-loot");
    const data = await response.json();

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

  await dropLoot();

  game.state = GAME_STATE.VICTORY;

  game.level++;
  lvlIndicator.innerText = game.level;

  game.hero.maxHp += SETTINGS.LEVEL_UP_HP;
  game.hero.hp += SETTINGS.LEVEL_UP_HP;
  game.hero.damage += SETTINGS.LEVEL_UP_DAMAGE;

  try {
    const response = await fetch(
      `http://localhost:3000/level-up?maxHp=${game.hero.maxHp}&hp=${game.hero.hp}&damage=${game.hero.damage}`,
    );
    const data = await response.json();
    console.log("Server sync: ", data.message);
  } catch (e) {
    console.error("Level up sync failed: ", e);
  }

  updateHeroUI();

  logMessage(`Level up! Current level: ${game.level}`, "black");
  logMessage(
    `Stats up: +${SETTINGS.LEVEL_UP_HP} HP, +${SETTINGS.LEVEL_UP_DAMAGE} DMG`,
    "blue",
  );
  logMessage(
    `Total stats: HP: ${game.hero.maxHp}, Damage: ${game.hero.damage}`,
  );

  myBtn.disabled = true;

  saveGame();
};

const enemyAttack = async () => {
  // Увеличение урона врага на 20% за 1 лвл
  try {
    const response = await fetch(
      `http://localhost:3000/enemy-attack?level=${game.level}`,
    );
    const data = await response.json();

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

const resetProgress = () => {
  game.reset();

  lvlIndicator.innerText = game.level;

  fetch("http://localhost:3000/reset-hero")
    .then((response) => response.json())
    .then((data) => console.log("Server status: ", data.message))
    .catch((e) => console.error("Failed to reset on server.", e));

  saveGame();
  initGame();
};

const initGame = () => {
  game.state = GAME_STATE.PLAYING;

  game.isProccessingTurn = false;

  // Если у героя хп 0 или меньше - хилим полностью
  if (game.hero.hp <= 0) {
    game.hero.hp = game.hero.maxHp;

    fetch("http://localhost:3000/heal-hero").catch((e) =>
      console.error("Failed to heal a hero on server. Reason: ", e),
    );
  }

  updateHeroUI();

  game.currentEnemy.hp = Math.floor(game.currentEnemy.maxHp * game.level);

  fetch(
    `http://localhost:3000/sync?name=${game.currentEnemy.name}&hp=${game.currentEnemy.hp}&damage=${game.currentEnemy.damage}`,
  )
    .then((response) => response.json())
    .then((data) => console.log("Synchronization: ", data.message))
    .catch((e) => console.error("Sync failed: ", e));

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

  myBtn.style.color = isDisabled ? "#BBB" : "";
  buyBtn.style.color = isDisabled ? "#BBB" : "";
  myResStat.style.color = isDisabled ? "#BBB" : "";
  myRestart.style.color = isDisabled ? "#BBB" : "";
};

myBtn.addEventListener("click", async () => {
  if (game.isProccessingTurn) return;

  try {
    const response = await fetch(`http://localhost:3000/hit`);
    const data = await response.json();

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

buyBtn.addEventListener("click", async () => {
  if (game.state !== GAME_STATE.PLAYING && game.state !== GAME_STATE.VICTORY) {
    console.log("Game is over, you cannot do anything with your inventory.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/buy-item?item=${ITEMS.BOMB}`,
    );
    const data = await response.json();

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

// Сохранение игры на локальный диск
const saveGame = () => {
  const payload = {
    level: game.level,
    inventory: game.inventory,
    gold: game.hero.gold,
  };

  fetch("http://localhost:3000/save-game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Сервер понимает, что внутри джсон
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => console.log("Server save: ", data.message))
    .catch((e) => console.error("Failed to save to server.", e));
};

const loadGame = async () => {
  try {
    const response = await fetch("http://localhost:3000/load-game");
    const data = await response.json();

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

    game.enemies = await fetchEnemies();

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
