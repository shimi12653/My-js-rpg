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

export const apiSyncEnemy = async (index) => {
  try {
    const response = await fetch(`${BASE_URL}/sync?index=${index}`);
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

export const apiSellItem = async (index) => {
  try {
    const response = await fetch(`${BASE_URL}/sell-item?index=${index}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (sell-item): ", e);
    throw e;
  }
};

export const apiMove = async (direction) => {
  try {
    const response = await fetch(`${BASE_URL}/move?dir=${direction}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (move): ", e);
    throw e;
  }
};

export const apiGetMap = async () => {
  try {
    const response = await fetch(`${BASE_URL}/map`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (getMap): ", e);
    throw e;
  }
};

export const apiFetchEnemies = async () => {
  try {
    const response = await fetch(`${BASE_URL}/enemies`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (enemies): ", e);
    throw e;
  }
};

export const apiUnequipItem = async (index) => {
  try {
    const response = await fetch(`${BASE_URL}/unequip-item?index=${index}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (unequip-item): ", e);
    throw e;
  }
};

export const apiUnequipArmor = async (slot) => {
  try {
    const response = await fetch(`${BASE_URL}/unequip-armor?slot=${slot}`);
    return await response.json();
  } catch (e) {
    console.error("Network Error (unequip-armor): ", e);
    throw e;
  }
};
