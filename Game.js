import { Hero } from "./Hero.js";
import { GAME_STATE } from "./constants.js";
import { ITEMS } from "./constants.js";

export class Game {
  constructor() {
    if (Game.instance) {
      return Game.instance;
    }

    this.level = 1;
    this.hero = new Hero();
    this.enemies = [];
    this.currentEnemy = null;
    this.state = GAME_STATE.PLAYING;
    this.isProccessingTurn = false;
    this.inventory = [];
    this.map = [];
    this.discoveredMap = [];

    Game.instance = this;
  }

  reset() {
    this.level = 1;
    this.hero = new Hero();

    this.inventory = [];
    this.inventory.push(ITEMS.SWORD);
    this.inventory.push("Cinderheart Pyre Staff");
    this.inventory.push("Abyssal Soulflame Staff");
    this.inventory.push("Grim Oathblade");
    this.inventory.push("Moonlit Executioner");
    this.inventory.push("Soul Reaper Scythe");
    this.inventory.push("Gravebound Crescent");
    this.inventory.push("Hollow Mask Daggers");
    this.inventory.push("Veinrender Twins");
    this.inventory.push("Whispering Bone Bow");
    this.inventory.push("Ashen Wraith Longbow");

    this.state = GAME_STATE.PLAYING;
    this.isProccessingTurn = false;
  }

  updateVision() {
    if (!this.map || this.map.length == 0 || !this.map[0]) {
      return;
    }

    const x = this.hero.x;
    const y = this.hero.y;

    const maxY = this.map.length;
    const maxX = this.map[0].length;

    // Освещение клекти героя
    this.discoveredMap[y][x] = true;

    // Логика освещения (без освещения края карты)
    // Тут else if писать нельзя, поскольку будет выполняться один блок, а не все
    if (y > 0) {
      this.discoveredMap[y - 1][x] = true; // Северная клетка
    }
    if (x > 0) {
      this.discoveredMap[y][x - 1] = true; // Западная клетка
    }
    if (y < maxY - 1) {
      this.discoveredMap[y + 1][x] = true; // Южная клетка
    }
    if (x < maxX - 1) {
      this.discoveredMap[y][x + 1] = true; // Восточная клетка
    }
  }
}
