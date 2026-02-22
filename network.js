"use strict";

import { Enemy } from "./Enemy.js";

const BASE_URL = "http://localhost:3000";

export const apiHealHero = async () => {
  try {
    const response = await fetch(`${BASE_URL}/heal-hero`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (heal-hero: ", e);
    throw e;
  }
};

export const apiLoadGame = async () => {
  try {
    const response = await fetch(`${BASE_URL}/load-game`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (load-game): ", e);
    throw e;
  }
};

export const apiSaveGame = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/save-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Сервер понимает, что внутри джсон
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (e) {
    console.error("Network error (save-game): ", e);
    throw e;
  }
};

export const apiUseItem = async (index) => {
  try {
    const response = await fetch(`${BASE_URL}/use-item?index=${index}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (use-item): ", e);
    throw e;
  }
};

export const apiGenerateLoot = async () => {
  try {
    const response = await fetch(`${BASE_URL}/generate-loot`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (generate-loot): ", e);
    throw e;
  }
};

export const apiLevelUp = async (maxHp, hp, damage) => {
  try {
    const response = await fetch(
      `${BASE_URL}/level-up?maxHp=${maxHp}&hp=${hp}&damage=${damage}`,
    );
    return await response.json();
  } catch (e) {
    console.error("Network Error (level-up): ", e);
    throw e;
  }
};

export const apiEnemyAttack = async (level) => {
  try {
    const response = await fetch(`${BASE_URL}/enemy-attack?level=${level}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (enemy-attack): ", e);
    throw e;
  }
};

export const apiResetHero = async () => {
  try {
    const response = await fetch(`${BASE_URL}/reset-hero`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (reset-hero): ", e);
    throw e;
  }
};

export const apiSyncEnemy = async (name, hp, damage) => {
  try {
    const response = await fetch(
      `${BASE_URL}/sync?name=${name}&hp=${hp}&damage=${damage}`,
    );
    return await response.json();
  } catch (e) {
    console.error("Network Error (sync): ", e);
    throw e;
  }
};

export const apiHit = async () => {
  try {
    const response = await fetch(`${BASE_URL}/hit`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (hit): ", e);
    throw e;
  }
};

export const apiBuyItem = async (item) => {
  try {
    const response = await fetch(`${BASE_URL}/buy-item?item=${item}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (but-item): ", e);
    throw e;
  }
};

export const apiFetchEnemies = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const serverData = [
        new Enemy(
          "Goblin",
          50,
          5,
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Goblin_by_armandeo64.jpg/640px-Goblin_by_armandeo64.jpg",
        ),
        new Enemy(
          "Orc",
          100,
          10,
          "https://i.pinimg.com/736x/1b/bd/48/1bbd4854fef85e7decdefa4b2ecfd9db.jpg",
        ),
        new Enemy(
          "Dragon",
          500,
          100,
          "https://i.pinimg.com/736x/98/78/37/987837c4eab3444e144e22ddf6ab0969.jpg",
        ),
      ];

      console.log("Server: Data sent.");
      resolve(serverData);
    }, 1500);
  });
};
