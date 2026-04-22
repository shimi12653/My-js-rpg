export const GAME_STATE = {
  PLAYING: "PLAYING",
  BATTLE: "BATTLE",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY",
};

export const ITEMS = {
  POTION: "Healing Potion",
  BOMB: "Bomb",
  SWORD: "Wooden Sword",
  GOLD: "Gold",
  STAFF: "Fire Staff",
  MANA_POTION: "Mana Potion",
  SCYTHE: "Iron Scythe",
  DUAL_DAGGERS: "Dual Daggers",
  BOW: "Wooden Bow",
};

export const SETTINGS = {
  // Размеры карты
  MAP_WIDTH: 30,
  MAP_HEIGHT: 30,
  STARTING_ENEMIES: 4,
  STARTING_CHESTS: 3,
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
  STARTING_GOLD: 500,
  STAFF_COST: 300,
  POTION_COST: 50,
  POTION_SELL_PRICE: 10,
  BOMB_SELL_PRICE: 25,
  STAFF_SELL_PRICE: 100,
  STAFF_MANA_COST: 15,
  MANA_RESTORE_COST: 25,
  MANA_POTION_COST: 50,
  MANA_POTION_SELL_PRICE: 10,
  SCYTHE_COST: 400,
  SCYTHE_SELL_PRICE: 80,
  DUAL_DAGGERS_COST: 350,
  DUAL_DAGGERS_SELL_PRICE: 70,
  BOW_COST: 300,
  BOW_SELL_PRICE: 60,
  SWORD_SELL_PRICE: 5,

  // progression
  LEVEL_UP_HP: 20,
  LEVEL_UP_DAMAGE: 2,
  ENEMY_LEVEL_MULTI: 0.2, // 20% + к силе за уровень
};

export const ADVANCED_WEAPONS = {
  CINDERHEART_STAFF: {
    name: "Cinderheart Pyre Staff",
    cost: 1500,
  },
  ABYSSAL_SOULFLAME_STAFF: {
    name: "Abyssal Soulflame Staff",
    cost: 2200,
  },
  GRIM_OATHBLADE: {
    name: "Grim Oathblade",
    cost: 1000,
  },
  MOONLIT_EXECUTIONER: {
    name: "Moonlit Executioner",
    cost: 1800,
  },
  SOUL_REAPER_SCYTHE: {
    name: "Soul Reaper Scythe",
    cost: 2400,
  },
  GRAVEBOUND_CRESCENT: {
    name: "Gravebound Crescent",
    cost: 2000,
  },
  HOLLOW_MASK_DAGGERS: {
    name: "Hollow Mask Daggers",
    cost: 1600,
  },
  VEINRENDER_TWINS: {
    name: "Veinrender Twins",
    cost: 2100,
  },
  WHISPERING_BONE_BOW: {
    name: "Whispering Bone Bow",
    cost: 1500,
  },
  ASHEN_WRAITH_LONGBOW: {
    name: "Ashen Wraith Longbow",
    cost: 2600,
  },
};

export const ARMOR_DATA = {
  // --- COMMON (Обычная) ---
  "Leather Helmet": { slot: "head", bonus: 2, cost: 100 },
  "Leather Armor": { slot: "chest", bonus: 5, cost: 200 },
  "Leather Pants": { slot: "legs", bonus: 3, cost: 150 },

  "Iron Helmet": { slot: "head", bonus: 4, cost: 250 },
  "Iron Plate": { slot: "chest", bonus: 10, cost: 500 },
  "Iron Greaves": { slot: "legs", bonus: 6, cost: 350 },

  "Chainmail Coif": { slot: "head", bonus: 3, cost: 180 },
  "Chainmail Hauberk": { slot: "chest", bonus: 8, cost: 400 },
  "Chainmail Leggings": { slot: "legs", bonus: 5, cost: 280 },

  // --- RARE (Редкая) ---
  "Steel Greathelm": { slot: "head", bonus: 7, cost: 800 },
  "Steel Cuirass": { slot: "chest", bonus: 18, cost: 1600 },
  "Steel Tassets": { slot: "legs", bonus: 10, cost: 1100 },

  "Shadow Hood": { slot: "head", bonus: 5, cost: 700 },
  "Shadow Garb": { slot: "chest", bonus: 15, cost: 1400 },
  "Shadow Boots": { slot: "legs", bonus: 10, cost: 1000 },

  "Silver Circlet": { slot: "head", bonus: 6, cost: 750 },
  "Silver Breastplate": { slot: "chest", bonus: 16, cost: 1500 },
  "Silver Leggings": { slot: "legs", bonus: 8, cost: 1050 },

  // --- EPIC (Эпическая) ---
  "Dragonscale Helm": { slot: "head", bonus: 12, cost: 3000 },
  "Dragonscale Plate": { slot: "chest", bonus: 35, cost: 6000 },
  "Dragonscale Greaves": { slot: "legs", bonus: 23, cost: 4500 },

  "Abyssal Crown": { slot: "head", bonus: 15, cost: 2800 },
  "Abyssal Robes": { slot: "chest", bonus: 40, cost: 5500 },
  "Abyssal Leggings": { slot: "legs", bonus: 25, cost: 4200 },

  "Celestial Halo": { slot: "head", bonus: 10, cost: 3200 },
  "Celestial Vestment": { slot: "chest", bonus: 30, cost: 6500 },
  "Celestial Kilt": { slot: "legs", bonus: 20, cost: 4800 },
};
