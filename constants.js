export const GAME_STATE = {
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY",
};

export const ITEMS = {
  POTION: "Healing Potion",
  BOMB: "Bomb",
  DAGGER: "Rusty Dagger",
  GOLD: "Gold",
  HSWORD: "Heavy Sword",
  STAFF: "Fire Staff",
  MANA_POTION: "Mana Potion",
  SCYTHE: "Iron Scythe",
  DUAL_SWORDS: "Dual Daggers",
};

export const SETTINGS = {
  // hero
  HERO_MAX_HP: 100,
  HEAL_AMOUNT: 20,
  CRIT_CHANCE: 0.2,
  WEAPON_DAMAGE: 5,
  MAX_HANDS: 2,
  HERO_MAX_MANA: 50,

  // fight
  BOMB_DAMAGE: 50,
  ENEMY_REGEN_PERCENT: 0.05,
  ENEMY_TURN_DELAY: 1000,

  // items (cost)
  GOLD_DROP: 50, // Имеется ввиду сколько золото с лута приносит
  BOMB_COST: 100,
  STARTING_GOLD: 1000,
  HSWORD_COST: 200,
  STAFF_COST: 300,
  DAGGER_SELL_PRICE: 15,
  POTION_COST: 50,
  POTION_SELL_PRICE: 10,
  BOMB_SELL_PRICE: 25,
  HSWORD_SELL_PRICE: 50,
  STAFF_SELL_PRICE: 100,
  STAFF_MANA_COST: 15,
  MANA_RESTORE_COST: 25,
  MANA_POTION_COST: 50,
  MANA_POTION_SELL_PRICE: 10,
  SCYTHE_COST: 400,
  SCYTHE_SELL_PRICE: 80,
  DUAL_SWORDS_COST: 350,
  DUAL_SWORDS_SELL_PRICE: 70,

  // progression
  LEVEL_UP_HP: 20,
  LEVEL_UP_DAMAGE: 2,
  ENEMY_LEVEL_MULTI: 0.2, // 20% + к силе за уровень
};
