export const ENEMIES_DB = {
  // --- TIER 1 (1 Этаж) ---
  goblin: {
    name: "Goblin",
    hp: 50,
    damage: 5,
    img: "https://i.pinimg.com/736x/4f/e6/2e/4fe62e54744e22350382f9d71f227f23.jpg",
    isBoss: false,
    tier: 1,
  },
  slime: {
    name: "Acid Slime",
    hp: 40,
    damage: 8, // Бьет больнее, но хилый
    img: "https://i.pinimg.com/736x/ac/6a/6c/ac6a6c297902d045ee26ee1dc5908696.jpg",
    isBoss: false,
    tier: 1,
  },
  rat: {
    name: "Crypt Rat",
    hp: 30,
    damage: 12, // Очень хлипкая, но кусается больно
    img: "https://i.pinimg.com/1200x/cc/8f/5a/cc8f5a8709f1a1948e19b96bbb579012.jpg",
    isBoss: false,
    tier: 1,
  },

  // --- TIER 2 (2 Этаж) ---
  orc: {
    name: "Orc",
    hp: 100,
    damage: 10,
    img: "https://i.pinimg.com/736x/1b/bd/48/1bbd4854fef85e7decdefa4b2ecfd9db.jpg",
    isBoss: false,
    tier: 2,
  },
  skeleton: {
    name: "Skeleton Warrior",
    hp: 80,
    damage: 15,
    img: "https://i.pinimg.com/1200x/cd/91/1a/cd911a1dbb7f846807dcd96820024d65.jpg",
    isBoss: false,
    tier: 2,
  },
  spider: {
    name: "Cave Spider",
    hp: 70,
    damage: 18,
    img: "https://i.pinimg.com/736x/08/bf/6f/08bf6f6f029a50e2e664c34258d3c555.jpg",
    isBoss: false,
    tier: 2,
  },

  // --- TIER 3 (3 Этаж) ---
  troll: {
    name: "Troll",
    hp: 200,
    damage: 25,
    img: "https://i.pinimg.com/736x/ab/dc/a6/abdca60cffacbec82002e9922869b78c.jpg",
    isBoss: false,
    tier: 3,
  },
  cultist: {
    name: "Dark Cultist",
    hp: 120,
    damage: 35, // Мало хп, но сносит лицо
    img: "https://i.pinimg.com/736x/67/ed/ce/67edce2992afc81dd6c91a2352202972.jpg",
    isBoss: false,
    tier: 3,
  },
  golem: {
    name: "Stone Golem",
    hp: 300,
    damage: 15, // Танк, ковырять придется долго
    img: "https://i.pinimg.com/736x/d3/2f/11/d32f11aa4b6dd89b9843c561ab4673c8.jpg",
    isBoss: false,
    tier: 3,
  },

  // --- TIER 5 (5 Этаж - БОСС) ---
  dragon: {
    name: "Dragon",
    hp: 500,
    damage: 50,
    img: "https://i.pinimg.com/736x/98/78/37/987837c4eab3444e144e22ddf6ab0969.jpg",
    isBoss: true,
    tier: 5,
  },
};
