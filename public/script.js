"use strict";

import { Game } from "./Game.js";
import { ITEMS, GAME_STATE, ARMOR_DATA } from "./constants.js";
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
  apiMove,
  apiGetMap,
  apiUnequipItem,
  apiUnequipArmor,
} from "./network.js";

const myBtn = document.querySelector("#attack-btn");
const mySpan = document.querySelector("#enemy-hp");
const enemyHpBar = document.querySelector("#enemy-hp-bar");
const myP = document.querySelector("#log");
const myRestart = document.querySelector("#restart-btn");
const myUl = document.querySelector("#inventory-list");
const enemyImg = document.querySelector("#enemy-img");
const lvlIndicator = document.querySelector("#game-level");
const buyBtn = document.querySelector("#buy-bomb-btn");
const loadingScreen = document.querySelector("#loading-screen");
const gameApp = document.querySelector("#game-app");
const heroHp = document.querySelector("#hero-hp");
const heroHpBar = document.querySelector("#hero-hp-bar");
const heroWeapons = document.querySelector("#hero-weapons");
const goldBalance = document.querySelector("#gold-balance");
const sellBtn = document.querySelector("#sell-mode-btn");
const shopList = document.querySelector("#shop-list");
const heroMp = document.querySelector("#hero-mp");
const heroMpBar = document.querySelector("#hero-mp-bar");
const moveNorth = document.querySelector("#btn-north");
const moveSouth = document.querySelector("#btn-south");
const moveEast = document.querySelector("#btn-east");
const moveWest = document.querySelector("#btn-west");
const miniMap = document.querySelector("#mini-map");
const dungeonFloor = document.querySelector("#dungeon-floor");
const keyIndicator = document.querySelector("#key-indicator");
const equippedWeaponsList = document.querySelector("#equipped-weapons-list");
const gameOverScreen = document.querySelector("#game-over-screen");
const victoryScreen = document.querySelector("#victory-screen");
const modalRestartBtn = document.querySelector("#modal-restart-btn");
const modalVictoryRestartBtn = document.querySelector(
  "#modal-victory-restart-btn",
);
const shopPanel = document.querySelector("#shop-panel");
const heroArmor = document.querySelector("#hero-armor");
const equippedArmorList = document.querySelector("#equipped-armor-list");

let isSellMode = false; // Состояние для продажи вещей

const game = new Game();

// Для логов (счётсчик логов и последнее сообщение)
let lastLogMessage = "";

let countLogMessages = 0;

let currentShop = []; // Сток магазин (заполняется при помощи generateShopinventory)

// Обаятельная функция логов
const logMessage = (text, color = "#F0FFFF", fontWeight = "normal") => {
  if (text === lastLogMessage) {
    countLogMessages++;

    const time = new Date().toLocaleTimeString();
    const newLog = `[${time}] ${text} (x${countLogMessages})`;

    myP.firstElementChild.innerHTML = newLog;
  } else {
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
    lastLogMessage = text;
    countLogMessages = 1;
  }
};

// Рендер карты
const renderMap = (mapData, discoveredMap, heroX, heroY) => {
  miniMap.innerText = "";
  // row - массив в карте (сверху вниз берётся), y - индекс строчки массива
  mapData.forEach((row, y) => {
    // cell - наша цифра внутрии массива (пока от 0 до 3), x - индекс cell'a
    row.forEach((cell, x) => {
      const div = document.createElement("div");

      // Выставляю стандартные настройки для дива
      div.setAttribute("style", "width: 15px; height: 15px;");
      div.style.fontSize = "10px";

      if (!discoveredMap[y][x]) {
        div.style.backgroundColor = "#000000";
      } else {
        // Закрашиваю события в их цвета
        if (cell === 0) {
          div.style.backgroundColor = "#1c1c1c";
        } else if (cell === 2) {
          div.style.backgroundColor = "#ffd700";
        } else if (cell === 3) {
          div.style.backgroundColor = "#800000";
        } else if (cell === 4) {
          div.style.backgroundColor = "#A0522D";
        } else if (cell === 5) {
          div.style.backgroundColor = "#A52A2A";
        } else if (cell === 6) {
          div.style.backgroundColor = "#00FFFF";
        } else {
          div.style.backgroundColor = "#696969";
        }
      }

      // Герой будет @ на синем фоне
      if (x === heroX && y === heroY) {
        div.style.backgroundColor = "#000080";
        div.innerText = "@";
        div.style.color = "#F8F8FF";
        div.style.textAlign = "center";
        div.style.lineHeight = "20px";
        div.style.fontWeight = "bold";
      }

      miniMap.appendChild(div);
    });
  });
};

// Жизни и бар хп героя
const updateHeroUI = (newStats) => {
  if (newStats) {
    if (newStats.hp !== undefined) game.hero.hp = newStats.hp;
    if (newStats.mana !== undefined) game.hero.mana = newStats.mana;
    if (newStats.gold !== undefined) game.hero.gold = newStats.gold;
    if (newStats.equippedWeapons !== undefined)
      game.hero.equippedWeapons = newStats.equippedWeapons;
    if (newStats.weapons !== undefined) game.hero.weapons = newStats.weapons;
    if (newStats.armor !== undefined) game.hero.armor = newStats.armor;
    if (newStats.equipment !== undefined)
      game.hero.equipment = newStats.equipment;
  }

  heroHp.innerText = game.hero.hp;
  heroMp.innerText = game.hero.mana;
  heroWeapons.innerText = `${game.hero.equippedWeapons || 0}/${game.hero.maxHands}`;
  goldBalance.innerText = game.hero.gold;
  heroArmor.innerText = game.hero.armor;

  equippedArmorList.innerHTML = "";

  Object.keys(game.hero.equipment).forEach((slot) => {
    // Перебираем все слоты
    const itemName = game.hero.equipment[slot];

    if (itemName) {
      const armorBtn = document.createElement("button");

      armorBtn.innerText = `[Снять ${slot}] ${itemName}`;
      armorBtn.className = "armor-btn";
      armorBtn.style.marginBottom = "5px";
      armorBtn.onclick = () => unequipArmor(slot);
      equippedArmorList.appendChild(armorBtn);
    }
  });

  const hpPercent = Math.max(0, (game.hero.hp / game.hero.maxHp) * 100);
  heroHpBar.style.width = `${hpPercent}%`;

  const mpPercent = Math.max(0, (game.hero.mana / game.hero.maxMana) * 100);
  heroMpBar.style.width = `${mpPercent}%`;

  equippedWeaponsList.innerHTML = "";

  if (game.hero.weapons && game.hero.weapons.length > 0) {
    game.hero.weapons.forEach((weapon, index) => {
      const wpnBtn = document.createElement("button");
      wpnBtn.innerText = `[Снять] ${weapon.name} (${weapon.baseDamage} dmg)`;
      wpnBtn.className = "weapon-btn"; // используется в будущем для добавления стилей css

      wpnBtn.setAttribute("style", "margin-bottom: 10px; cursor: pointer;");

      wpnBtn.onclick = () => unequipItem(index);

      equippedWeaponsList.appendChild(wpnBtn);
    });
  }
};

// Снятие предмета с героя
const unequipItem = async (index) => {
  try {
    const data = await apiUnequipItem(index);

    if (data.success) {
      updateHeroUI(data.heroStats);

      game.inventory.length = 0;
      game.inventory.push(...data.inventory);

      renderInventory();

      logMessage(data.message, "orange");
    }
  } catch (e) {
    console.error("Failed to unequip item: ", e);
  }
};

// Снятие брони с героя
const unequipArmor = async (slot) => {
  try {
    const data = await apiUnequipArmor(slot);

    if (data.success) {
      updateHeroUI(data.heroStats);

      game.inventory.length = 0;
      game.inventory.push(...data.inventory);

      renderInventory();
      logMessage(data.message, "orange");
      await saveGame();
    }
  } catch (e) {
    console.error("Failed to unequip armor: ", e);
  }
};

// Жизни и бар хп врага
const updateEnemyUI = () => {
  mySpan.innerText = game.currentEnemy.hp;

  enemyImg.src = game.currentEnemy.img;

  const hpPercent = Math.max(
    0,
    (game.currentEnemy.hp / game.currentEnemy.maxHp) * 100,
  );

  enemyHpBar.style.width = `${hpPercent}%`;
};

// Функция рендера магазина
const renderShop = (itemsToSell) => {
  shopList.innerHTML = "";

  itemsToSell.forEach((shopItem) => {
    const newLi = document.createElement("li");
    newLi.innerText = `${shopItem.name}. Price: ${shopItem.price} gold`;
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
        console.log("Game is over, you cannot do anything with shop.");
        return;
      }

      try {
        const data = await apiBuyItem(shopItem.name);

        if (data.success) {
          game.hero.gold = data.goldLeft;
          game.inventory.length = 0;
          game.inventory.push(...data.inventory);
          logMessage(data.message, "#9370db");
          renderInventory();
          updateHeroUI();
          await saveGame();
        } else {
          logMessage(data.message, "red");
        }
      } catch (e) {
        console.error("Failed to buy item: ", e);
      }
    });
    shopList.appendChild(newLi);
  });
};

// Рандомная генерация вещей в магазин
const generateShopInventory = () => {
  let newShop = []; // Стоковый магазин

  newShop.push({ name: ITEMS.BOMB, price: SETTINGS.BOMB_COST }); // Добавляем сперва бомбу

  // Функция для получения рандомного зелья манны и хилки
  const getPotion = (isMana) => {
    const randomRoll = Math.random();

    if (isMana) {
      if (randomRoll < 0.5) {
        newShop.push({
          name: ITEMS.MANA_POTION,
          price: SETTINGS.MANA_POTION_COST,
        });
      } else if (randomRoll < 0.85) {
        newShop.push({
          name: ITEMS.MEDIUM_MANA_POTION,
          price: SETTINGS.MEDIUM_MANA_POTION_COST,
        });
      } else {
        newShop.push({
          name: ITEMS.LARGE_MANA_POTION,
          price: SETTINGS.LARGE_MANA_POTION_COST,
        });
      }
    } else {
      if (randomRoll < 0.5) {
        newShop.push({ name: ITEMS.POTION, price: SETTINGS.POTION_COST });
      } else if (randomRoll < 0.85) {
        newShop.push({
          name: ITEMS.MEDIUM_POTION,
          price: SETTINGS.MEDIUM_POTION_COST,
        });
      } else {
        newShop.push({
          name: ITEMS.LARGE_POTION,
          price: SETTINGS.LARGE_POTION_COST,
        });
      }
    }
  };

  getPotion(true); // Получение зелья хилки
  getPotion(false); // Получение зелья манны

  const equipmentPool = [
    { name: ITEMS.STAFF, price: SETTINGS.STAFF_COST },
    { name: ITEMS.SCYTHE, price: SETTINGS.SCYTHE_COST },
    { name: ITEMS.DUAL_DAGGERS, price: SETTINGS.DUAL_DAGGERS_COST },
    { name: ITEMS.BOW, price: SETTINGS.BOW_COST },
  ]; // Все редкие виды оружия

  Object.keys(ARMOR_DATA).forEach((armorName) => {
    const cost = ARMOR_DATA[armorName].cost;

    if (cost >= 600 && cost < 2000) {
      equipmentPool.push({ name: armorName, price: cost });
    }
  }); // Добавление редких видов брони (в зависимости от цены (от 600 до 2000 - редкие оружия))

  // Добавление 3 случайных шмоток в магазин
  for (let i = 0; i < 3; i++) {
    let randomItem = Math.floor(Math.random() * equipmentPool.length);
    const equip = equipmentPool.splice(randomItem, 1)[0];
    newShop.push(equip);
  }

  return newShop;
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

      if (game.state === GAME_STATE.GAME_OVER) {
        console.log("You are dead. Inventory is locked.");
        return;
      }

      if (isSellMode) {
        try {
          const data = await apiSellItem(index); // Вызываем апи по индексу предмета

          if (data.success) {
            game.inventory.length = 0;
            game.inventory.push(...data.inventory);

            game.hero.gold = data.goldLeft;

            logMessage(data.message, "#00de1a");

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
            game.hero.mana = data.heroStats.mana;
            game.hero.equippedWeapons = data.heroStats.equippedWeapons;
            game.hero.armor = data.heroStats.armor || 0;
            game.currentEnemy.hp = data.enemyHpLeft;
            game.hero.weapons = data.heroStats.weapons || [];
            game.hero.equipment = data.heroStats.equipment || {
              head: null,
              chest: null,
              legs: null,
            };

            logMessage(
              data.message,
              data.itemUsed === ITEMS.BOMB ? "red" : "#9370db",
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
              (game.currentEnemy.hp / game.currentEnemy.maxHp) * 100;
            enemyHpBar.style.width = `${barWidth}%`;

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

    logMessage(data.message, "#9370db");

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
  logMessage("Enemy is dead. Victory!", "#6495ED", "bold");
  enemyHpBar.style.width = "0%";
  toggleCombatUI(false);

  if (dungeonFloor.innerText === "5") {
    victoryScreen.classList.remove("hidden");

    logMessage("The Dragon is dead! The realm is safe.", "#FFD700", "bold");

    game.state = GAME_STATE.VICTORY;

    return;
  }

  try {
    await dropLoot();

    const newLevel = game.level + 1;
    const newMaxHp = game.hero.maxHp + SETTINGS.LEVEL_UP_HP;
    const newHp = game.hero.hp + SETTINGS.LEVEL_UP_HP;
    const newDamage = game.hero.damage + SETTINGS.LEVEL_UP_DAMAGE;

    const data = await apiLevelUp(newMaxHp, newHp, newDamage);

    logMessage(data.message, "#F0FFFF");

    if (data.stairsUnlocked) {
      keyIndicator.innerText = "Found";
      keyIndicator.style.color = "#ffd700";
    }

    game.state = GAME_STATE.VICTORY;
    game.level = newLevel;
    lvlIndicator.innerText = game.level;

    game.hero.hp = newHp;
    game.hero.maxHp = newMaxHp;
    game.hero.damage = newDamage;

    updateHeroUI();

    logMessage(
      `Level up (${game.level})! +${SETTINGS.LEVEL_UP_HP} HP, +${SETTINGS.LEVEL_UP_DAMAGE} DMG.`,
      "#6495ED",
      "bold",
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

    if (data.burnMessage) {
      logMessage(data.burnMessage, "orange");

      game.currentEnemy.hp = data.enemyHpLeft;

      mySpan.innerText = game.currentEnemy.hp;
      const barWidth =
        (game.currentEnemy.hp / (game.currentEnemy.maxHp * game.level)) * 100;
      enemyHpBar.style.width = `${Math.max(0, barWidth)}%`;
    }

    if (data.isEnemyDead) {
      // Вывод в лог если враг умер
      logMessage(data.message, "#9370db");
      handleVictory();
      return;
    } else {
      if (data.isDodged) {
        logMessage(`You dodged enemy attack. Great reaction!`, "#F0FFFF");
      } else {
        logMessage(
          `Enemy hits you for ${data.damageDealt} damage! (Crit level: ${data.critLevel}x)`,
          "red",
        );
      }
    }

    if (game.hero.hp <= 0) {
      game.hero.hp = 0;
      game.state = GAME_STATE.GAME_OVER;

      myBtn.disabled = true;
      myBtn.style.color = "#BBB";
      logMessage("You died... Game over.", "red", "bold");

      // Удаляем из текста экрана проигрыша hidden (чтобы экран не был скрыт)
      gameOverScreen.classList.remove("hidden");
    }
  } catch (e) {
    logMessage("Server unavailable. Enemy missed.", "red");
  }
};

const resetProgress = async () => {
  try {
    const data = await apiResetHero();

    game.reset();
    lvlIndicator.innerText = game.level;
    dungeonFloor.innerText = "1"; // Чтобы 100% сбросился уровень данжа

    console.log(data.message);
  } catch (e) {
    console.error("Failed to reset on server.", e);
  }

  await saveGame(); // await тут конкретно необязательно писать (он выполниться в любом случае, поскольку функция async), но пусть лучше будет
  initGame();
};

const initGame = async () => {
  game.isProccessingTurn = false;

  // Защита от хилла на F5
  if (game.state === GAME_STATE.GAME_OVER) {
    toggleCombatUI(false);
    toggleControls(true);
    myRestart.disabled = false;
    logMessage(`You are dead. Press 'Play Again' to restart.`, "red", "bold");
    updateHeroUI();
    return;
  }

  if (game.state === GAME_STATE.BATTLE) {
    toggleCombatUI(true);
  } else {
    toggleCombatUI(false);
  }

  updateHeroUI();

  // Рендер карты
  try {
    const mapResponse = await apiGetMap();

    renderMap(
      mapResponse.map,
      mapResponse.discoveredMap,
      mapResponse.heroX,
      mapResponse.heroY,
    );
  } catch (e) {
    console.error("Load map failed: ", e);
  }

  toggleControls(false);

  mySpan.innerText = game.currentEnemy.hp;
  myBtn.disabled = false;
  myBtn.style.color = "";

  logMessage("New game started...", "#F0FFFF");

  if (game.currentEnemy) {
    const hpPercent = (game.currentEnemy.hp / game.currentEnemy.maxHp) * 100;
    enemyHpBar.style.width = `${Math.max(0, hpPercent)}`;
  }

  mySpan.style.color = "";
  enemyImg.src = game.currentEnemy.img;
  heroHp.innerText = game.hero.hp;

  renderInventory();

  if (dungeonFloor.innerText === "4") {
    currentShop = generateShopInventory();
    renderShop(currentShop);
    shopPanel.style.display = "block";
  }
};

// Скрытие интерфейса боя
const toggleCombatUI = (isCombat) => {
  const combatPanel = document.querySelector("#combat-panel");
  if (isCombat) {
    combatPanel.style.display = "block"; // Враг показан на экране
  } else {
    combatPanel.style.display = "none";
  }
};

// Функция для блокировки интерфейса кнопок
const toggleControls = (isDisabled) => {
  myBtn.disabled = isDisabled;
  myRestart.disabled = isDisabled;
  sellBtn.disabled = isDisabled;
  shopList.disabled = isDisabled;

  myBtn.style.color = isDisabled ? "#BBB" : "";
  myRestart.style.color = isDisabled ? "#BBB" : "";
  sellBtn.style.color = isDisabled ? "#BBB" : "";
  shopList.style.color = isDisabled ? "#BBB" : "";
};

// Кнопки движения
moveNorth.addEventListener("click", async () => {
  try {
    const data = await apiMove("north");

    if (data.success) {
      if (data.goldLeft !== undefined) {
        game.hero.gold = data.goldLeft;
        updateHeroUI();
      }

      // Если что-то произошло с пероснажем - обновляем статистику
      if (data.heroStats) {
        updateHeroUI(data.heroStats);
        logMessage(data.message, "#00bfff");
      }

      if (data.isEvent) {
        logMessage(data.message, data.eventColor, "bold");
      }

      // Рендер карты
      try {
        const mapResponse = await apiGetMap();

        renderMap(
          mapResponse.map,
          mapResponse.discoveredMap,
          mapResponse.heroX,
          mapResponse.heroY,
        );
      } catch (e) {
        console.error("Load map failed: ", e);
      }

      if (data.battleStarted) {
        game.state = GAME_STATE.BATTLE;

        toggleCombatUI(true);

        logMessage(data.message, "red");

        game.currentEnemy = data.currentEnemy;

        updateEnemyUI();

        myBtn.disabled = false;
        myBtn.style.color = "";
      }

      // Переход на новый этаж
      if (data.currentFloor) {
        dungeonFloor.innerText = data.currentFloor;
        logMessage(`You are on floor ${data.currentFloor}`, "#4169E1");

        if (data.stairsUnlocked) {
          keyIndicator.innerText = "Found";
          keyIndicator.style.color = "#ffd700";
        } else {
          keyIndicator.innerText = "Not found";
          keyIndicator.style.color = "#aaa";
        }

        if (data.currentFloor === 4) {
          shopPanel.style.display = "block";
          logMessage(
            "Merchant: 'Welcome to my humble shop, travaler!",
            "#FFD700",
          );

          currentShop = generateShopInventory();
          renderShop(currentShop);
        } else {
          shopPanel.style.display = "none";
        }
      }
    } else {
      logMessage(data.message, "#3b8898");
    }
  } catch (e) {
    logMessage("Server unavailable. Move failed.", "red");
  }
});

moveSouth.addEventListener("click", async () => {
  try {
    const data = await apiMove("south");

    if (data.success) {
      if (data.goldLeft !== undefined) {
        game.hero.gold = data.goldLeft;
        updateHeroUI();
      }

      // Если что-то произошло с пероснажем - обновляем статистику
      if (data.heroStats) {
        updateHeroUI(data.heroStats);
        logMessage(data.message, "#00bfff");
      }

      if (data.isEvent) {
        logMessage(data.message, data.eventColor, "bold");
      }

      // Рендер карты
      try {
        const mapResponse = await apiGetMap();

        renderMap(
          mapResponse.map,
          mapResponse.discoveredMap,
          mapResponse.heroX,
          mapResponse.heroY,
        );
      } catch (e) {
        console.error("Load map failed: ", e);
      }

      if (data.battleStarted) {
        game.state = GAME_STATE.BATTLE;

        toggleCombatUI(true);

        logMessage(data.message, "red");

        game.currentEnemy = data.currentEnemy;

        updateEnemyUI();

        myBtn.disabled = false;
        myBtn.style.color = "";
      }

      // Переход на новый этаж
      if (data.currentFloor) {
        dungeonFloor.innerText = data.currentFloor;
        logMessage(`You are on floor ${data.currentFloor}`, "#4169E1");

        if (data.stairsUnlocked) {
          keyIndicator.innerText = "Found";
          keyIndicator.style.color = "#ffd700";
        } else {
          keyIndicator.innerText = "Not found";
          keyIndicator.style.color = "#aaa";
        }

        if (data.currentFloor === 4) {
          shopPanel.style.display = "block";
          logMessage(
            "Merchant: 'Welcome to my humble shop, travaler!",
            "#FFD700",
          );

          currentShop = generateShopInventory();
          renderShop(currentShop);
        } else {
          shopPanel.style.display = "none";
        }
      }
    } else {
      logMessage(data.message, "#3b8898");
    }
  } catch (e) {
    logMessage("Server unavailable. Move failed.", "red");
  }
});

moveEast.addEventListener("click", async () => {
  try {
    const data = await apiMove("east");

    if (data.success) {
      if (data.goldLeft !== undefined) {
        game.hero.gold = data.goldLeft;
        updateHeroUI();
      }

      // Если что-то произошло с пероснажем - обновляем статистику
      if (data.heroStats) {
        updateHeroUI(data.heroStats);
        logMessage(data.message, "#00bfff");
      }

      if (data.isEvent) {
        logMessage(data.message, data.eventColor, "bold");
      }

      // Рендер карты
      try {
        const mapResponse = await apiGetMap();

        renderMap(
          mapResponse.map,
          mapResponse.discoveredMap,
          mapResponse.heroX,
          mapResponse.heroY,
        );
      } catch (e) {
        console.error("Load map failed: ", e);
      }

      if (data.battleStarted) {
        game.state = GAME_STATE.BATTLE;

        toggleCombatUI(true);

        logMessage(data.message, "red");

        game.currentEnemy = data.currentEnemy;

        updateEnemyUI();

        myBtn.disabled = false;
        myBtn.style.color = "";
      }

      // Переход на новый этаж
      if (data.currentFloor) {
        dungeonFloor.innerText = data.currentFloor;
        logMessage(`You are on floor ${data.currentFloor}`, "#4169E1");

        if (data.stairsUnlocked) {
          keyIndicator.innerText = "Found";
          keyIndicator.style.color = "#ffd700";
        } else {
          keyIndicator.innerText = "Not found";
          keyIndicator.style.color = "#aaa";
        }

        if (data.currentFloor === 4) {
          shopPanel.style.display = "block";
          logMessage(
            "Merchant: 'Welcome to my humble shop, travaler!",
            "#FFD700",
          );

          currentShop = generateShopInventory();
          renderShop(currentShop);
        } else {
          shopPanel.style.display = "none";
        }
      }
    } else {
      logMessage(data.message, "#3b8898");
    }
  } catch (e) {
    logMessage("Server unavailable. Move failed.", "red");
  }
});

moveWest.addEventListener("click", async () => {
  try {
    const data = await apiMove("west");

    if (data.success) {
      if (data.goldLeft !== undefined) {
        game.hero.gold = data.goldLeft;
        updateHeroUI();
      }

      // Если что-то произошло с пероснажем - обновляем статистику
      if (data.heroStats) {
        updateHeroUI(data.heroStats);
        logMessage(data.message, "#00bfff");
      }

      if (data.isEvent) {
        logMessage(data.message, data.eventColor, "bold");
      }

      // Рендер карты
      try {
        const mapResponse = await apiGetMap();

        renderMap(
          mapResponse.map,
          mapResponse.discoveredMap,
          mapResponse.heroX,
          mapResponse.heroY,
        );
      } catch (e) {
        console.error("Load map failed: ", e);
      }

      if (data.battleStarted) {
        game.state = GAME_STATE.BATTLE;

        toggleCombatUI(true);

        logMessage(data.message, "red");

        game.currentEnemy = data.currentEnemy;

        updateEnemyUI();

        myBtn.disabled = false;
        myBtn.style.color = "";
      }

      // Переход на новый этаж
      if (data.currentFloor) {
        dungeonFloor.innerText = data.currentFloor;
        logMessage(`You are on floor ${data.currentFloor}`, "#4169E1");

        if (data.stairsUnlocked) {
          keyIndicator.innerText = "Found";
          keyIndicator.style.color = "#ffd700";
        } else {
          keyIndicator.innerText = "Not found";
          keyIndicator.style.color = "#aaa";
        }

        if (data.currentFloor === 4) {
          shopPanel.style.display = "block";
          logMessage(
            "Merchant: 'Welcome to my humble shop, travaler!",
            "#FFD700",
          );

          currentShop = generateShopInventory();
          renderShop(currentShop);
        } else {
          shopPanel.style.display = "none";
        }
      }
    } else {
      logMessage(data.message, "#3b8898");
    }
  } catch (e) {
    logMessage("Server unavailable. Move failed.", "red");
  }
});

// Кнопка атаки
myBtn.addEventListener("click", async () => {
  if (game.isProccessingTurn) return;

  try {
    const data = await apiHit();

    // Проверка пришло ли false
    if (!data.success) {
      logMessage(data.message, "red", "bold");
      return;
    }

    // Проверка пришла ли мана
    if (data.manaLeft !== undefined) {
      game.hero.mana = data.manaLeft;
    }

    // Проверка вампиризма
    if (data.heroHpLeft !== undefined) {
      game.hero.hp = data.heroHpLeft;

      if (data.drainAmount) {
        logMessage(`Drain! You restored ${data.drainAmount} HP.`, "#8B0000");
      }
    }

    if (data.isDoubleStrike) {
      logMessage(`Double Strike. Flurry of blows!`, `#1e90ff`);
    }

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
        (game.currentEnemy.hp / game.currentEnemy.maxHp) * 100;
      enemyHpBar.style.width = `${percNewEnemyHp}%`;

      game.isProccessingTurn = true;
      toggleControls(true);

      setTimeout(async () => {
        await enemyAttack();

        game.isProccessingTurn = false;

        toggleControls(false);

        if (
          game.state === GAME_STATE.GAME_OVER ||
          game.state === GAME_STATE.VICTORY
        ) {
          toggleControls(false);

          myBtn.disabled = true;
          myBtn.style.color = "#BBB";
        }

        saveGame();
      }, SETTINGS.ENEMY_TURN_DELAY);
    }
    updateHeroUI();
  } catch (e) {
    console.error(e);
    logMessage("Server unavailable. Play offline.", "red");
  }
  updateHeroUI();
});

// Кнопка рестарта игры
myRestart.addEventListener("click", async () => {
  logMessage(
    "The Gods wipe your memory and send you back to the Abyss...",
    "#1e90ff",
    "bold",
  );
  await resetProgress();
  toggleCombatUI(false);
  saveGame();
});

// Кнопки на экранах смерти/победы
modalRestartBtn.addEventListener("click", async () => {
  gameOverScreen.classList.add("hidden");
  logMessage(
    "The Gods wipe your memory and send you back to the Abyss...",
    "#1e90ff",
    "bold",
  );
  await resetProgress();
  toggleCombatUI(false);
  saveGame();
});

modalVictoryRestartBtn.addEventListener("click", async () => {
  victoryScreen.classList.add("hidden");
  logMessage(
    "A new hero enters the dungeon to seek glory...",
    "#ffd700",
    "bold",
  );
  await resetProgress();
  toggleCombatUI(false);
  saveGame();
});

// Кнопка продажи вещей
sellBtn.addEventListener("click", () => {
  isSellMode = !isSellMode;

  if (isSellMode) {
    sellBtn.innerText = "Sell Mode: ON";
    sellBtn.style.backgroundColor = "#b8860b";
    sellBtn.style.color = "#ffffff";
    myUl.classList.add("sell-mode-active");
  } else {
    sellBtn.innerText = "Sell Mode: OFF";
    sellBtn.style.backgroundColor = "";
    sellBtn.style.color = "";
    myUl.classList.remove("sell-mode-active");
  }
});

// Сохранение и загрузка игры
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

    game.state = data.state;

    if (data.currentEnemy) {
      game.currentEnemy = data.currentEnemy;
    }

    if (data.currentFloor) {
      dungeonFloor.innerText = data.currentFloor;
    }

    if (data.stairsUnlocked) {
      keyIndicator.innerText = "Found";
      keyIndicator.style.color = "#ffd700";
    } else {
      keyIndicator.innerText = "Not found";
      keyIndicator.style.color = "#aaa";
    }

    game.level = data.level || 1;
    lvlIndicator.innerText = game.level;

    game.inventory.length = 0;
    game.inventory.push(...data.inventory);

    game.hero.hp = data.heroStats.hp;
    game.hero.maxHp = data.heroStats.maxHp;
    game.hero.damage = data.heroStats.damage;
    game.hero.gold = data.heroStats.gold;
    game.hero.armor = data.heroStats.armor || 0;
    game.hero.equippedWeapons = data.heroStats.equippedWeapons || 0;
    game.hero.weapons = data.heroStats.weapons || [];
    game.hero.equipment = data.heroStats.equipment || {
      head: null,
      chest: null,
      legs: null,
    };

    console.log("Game loaded successfully.");
  } catch (e) {
    console.error("Failed to load game from server.", e);
  }
};

const startApp = async () => {
  try {
    loadingScreen.style.display = "flex";

    game.enemies = await apiFetchEnemies();

    const firstEnemy = Object.keys(game.enemies)[0];
    game.currentEnemy = game.enemies[firstEnemy];

    loadingScreen.style.display = "none";
    gameApp.style.display = "block"; // тут мы игру начинаем, блокируем её, то биш начинаем

    await loadGame();

    if (!game.currentEnemy) game.currentEnemy = game.enemies[firstEnemy];

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

document.addEventListener("keydown", (event) => {
  if (game.isProccessingTurn || isSellMode) return;

  if (moveNorth.disabled) return;

  const key = event.key.toLowerCase();

  switch (key) {
    case "w":
    case "ц":
    case "arrowup":
      moveNorth.click();
      break;

    case "a":
    case "ф":
    case "arrowleft":
      moveWest.click();
      break;

    case "s":
    case "ы":
    case "і":
    case "arrowdown":
      moveSouth.click();
      break;

    case "d":
    case "в":
    case "arrowright":
      moveEast.click();
      break;

    case "e":
    case "у":
      myBtn.click();
      break;
  }
});
