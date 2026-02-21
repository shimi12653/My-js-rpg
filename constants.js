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
};

export const SETTINGS = {
  // hero
  HERO_MAX_HP: 100,
  HEAL_AMOUNT: 20,
  CRIT_CHANCE: 0.2,
  WEAPON_DAMAGE: 5,
  MAX_HANDS: 2,

  // fight
  BOMB_DAMAGE: 50,
  ENEMY_REGEN_PERCENT: 0.05,
  ENEMY_TURN_DELAY: 1000,

  // items
  GOLD_DROP: 50, // Имеется ввиду сколько золото с лута приносит
  BOMB_COST: 100,
  STARTING_GOLD: 0,

  // progression
  LEVEL_UP_HP: 20,
  LEVEL_UP_DAMAGE: 2,
  ENEMY_LEVEL_MULTI: 0.2, // 20% + к силе за уровень
};
