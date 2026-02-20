"use strict";

import { Game } from "./Game.js";
import { ITEMS, GAME_STATE } from "./constants.js";
import { Hero } from "./Hero.js";
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

    newLi.addEventListener("click", () => {
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

      const updateInventory = () => {
        game.inventory.splice(index, 1);
        renderInventory();
        saveGame();
      };

      if (item === ITEMS.POTION) {
        if (game.hero.hp <= 0) {
          logMessage("You used a potion, but you are already dead.", "red");
        } else {
          game.hero.heal(SETTINGS.HEAL_AMOUNT);
          updateHeroUI();

          logMessage(
            `You use a healing potion! Hp: ${SETTINGS.HEAL_AMOUNT}`,
            "black",
          );
        }

        updateInventory();
      } else if (item === ITEMS.BOMB) {
        if (game.currentEnemy.hp > SETTINGS.BOMB_DAMAGE) {
          game.currentEnemy.hp -= SETTINGS.BOMB_DAMAGE;

          fetch("http://localhost:3000/bomb")
            .then((response) => response.json())
            .then((data) =>
              logMessage(
                `Server: ${data.message} (Enemy HP: ${data.enemyHpLeft})`,
                "purple",
                "bold",
              ),
            )
            .catch((error) =>
              console.error("Bomb error on the server: ", error),
            );

          logMessage(`BOOM! -${SETTINGS.BOMB_DAMAGE} enemy hp`, "red");

          game.isProccessingTurn = true;
          toggleControls(true);

          setTimeout(() => {
            enemyAttack();
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
        } else if (game.currentEnemy.hp === 0) {
          logMessage("You used a bomb, but enemy is already dead.", "red");
        } else {
          fetch("http://localhost:3000/bomb")
            .then((response) => response.json())
            .then((data) =>
              logMessage(
                `Server: ${data.message} (Enemy HP: ${data.enemyHpLeft})`,
                "purple",
                "bold",
              ),
            )
            .catch((error) =>
              console.error("Bomb error on the server: ", error),
            );

          handleVictory();

          logMessage("BOOM! Fatal damage!", "black");
        }

        updateInventory();
      } else if (item === ITEMS.DAGGER) {
        const weaponDamage = SETTINGS.WEAPON_DAMAGE;

        const isEquipped = game.hero.equipWeapon(weaponDamage);

        if (isEquipped) {
          logMessage(
            `You equipped ${item} and get +${weaponDamage} to your attack. Total damage: ${game.hero.damage}`,
            "black",
          );

          updateInventory();
        } else {
          logMessage(
            `You can't take more than ${game.hero.maxHands} swords.`,
            "red",
          );
        }
      } else if (item === ITEMS.GOLD) {
        game.hero.addGold(SETTINGS.GOLD_DROP);

        logMessage(`Here we go! You have ${game.hero.gold} gold.`, "black");

        updateInventory();
      }

      mySpan.innerText = game.currentEnemy.hp;
      const barWidth =
        (game.currentEnemy.hp / (game.currentEnemy.maxHp * game.level)) * 100;
      myHpBar.style.width = `${barWidth}%`;
    });

    myUl.appendChild(newLi);
  });
};

// Функционал выпадения предметов
const dropLoot = () => {
  const yourLuck = Math.random();

  if (yourLuck < 0.5) {
    const possibleLoot = [ITEMS.POTION, ITEMS.DAGGER, ITEMS.GOLD];

    const loot = possibleLoot[Math.floor(Math.random() * possibleLoot.length)];

    game.inventory.push(loot);

    logMessage(`Enemy dropped ${loot}. Congratulations!`, "black");
  } else {
    logMessage(`No loot found.`, "black");
  }

  renderInventory();
};

// Функция победы (чтобы не писать это всё много раз снова и снова)
const handleVictory = () => {
  game.currentEnemy.hp = 0;
  mySpan.innerText = 0;

  mySpan.style.color = "red";
  myBtn.disabled = true;
  myBtn.style.color = "#BBBBBB";

  logMessage("Enemy is dead. Victory!", "blue", "bold");
  myHpBar.style.width = "0%";

  clearInterval(regenTimer);

  dropLoot();

  game.state = GAME_STATE.VICTORY;

  game.level++;
  lvlIndicator.innerText = game.level;

  game.hero.maxHp += SETTINGS.LEVEL_UP_HP;
  game.hero.hp += SETTINGS.LEVEL_UP_HP;
  game.hero.damage += SETTINGS.LEVEL_UP_DAMAGE;

  fetch(
    `http://localhost:3000/level-up?maxHp=${game.hero.maxHp}&hp=${game.hero.hp}&damage=${game.hero.damage}`,
  )
    .then((response) => response.json())
    .then((data) => console.log("Server sync: ", data.message))
    .catch((e) => console.error("Level up sync failed: ", e));

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
    `http://localhost:3000/sync?name=${game.currentEnemy.name}&hp=${game.currentEnemy.hp}`,
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

buyBtn.addEventListener("click", () => {
  if (game.state !== GAME_STATE.PLAYING && game.state !== GAME_STATE.VICTORY) {
    console.log("Game is over, you cannot do anything with your inventory.");
    return;
  }

  const isTransactionSuccess = game.hero.spendGold(SETTINGS.BOMB_COST);
  if (isTransactionSuccess) {
    game.inventory.push(ITEMS.BOMB);
    renderInventory();

    logMessage(
      `You bought a bomb. It cost 100 gold. Your balance: ${game.hero.gold}.`,
      "black",
    );

    saveGame();
  } else {
    logMessage(`Not enough money, bucko!`, "red");
  }
});

// Сохранение игры на локальный диск
const saveGame = () => {
  const gameData = {
    level: game.level,
    heroStats: game.hero,
    bag: game.inventory,
  };

  localStorage.setItem("myRPG", JSON.stringify(gameData));
};

const loadGame = () => {
  const dataString = localStorage.getItem("myRPG");

  if (dataString) {
    const gameData = JSON.parse(dataString);
    game.level = gameData.level;

    game.hero.loadData(gameData.heroStats);

    game.inventory.length = 0;
    game.inventory.push(...gameData.bag);

    lvlIndicator.innerText = game.level;
    console.log("Game loaded.");
  }
};

const startApp = async () => {
  try {
    loadingScreen.style.display = "flex";

    game.enemies = await fetchEnemies();

    game.currentEnemy = game.enemies[0];

    loadingScreen.style.display = "none";
    gameApp.style.display = "block"; // тут мы игру начинаем, блокируем её, то биш начинаем

    loadGame();

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
