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
    this.inventory = [
      ITEMS.SWORD,
      "Leather Helmet",
      "Leather Armor",
      "Leather Pants",
    ];
    this.map = [];
    this.discoveredMap = [];

    Game.instance = this;
  }

  reset() {
    this.level = 1;
    this.hero = new Hero();

    this.inventory = [];
    this.inventory.push(ITEMS.SWORD);
    this.inventory.push("Leather Helmet");
    this.inventory.push("Leather Armor");
    this.inventory.push("Leather Pants");

    this.state = GAME_STATE.PLAYING;
    this.isProccessingTurn = false;
  }

  // Метод для виденья карты
  updateVision() {
    if (!this.map || this.map.length == 0 || !this.map[0]) {
      return;
    }

    const x = this.hero.x;
    const y = this.hero.y;

    const maxY = this.map.length;
    const maxX = this.map[0].length;

    const radius = 2; // просвет вокруг игрока

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const checkY = y + dy;
        const checkX = x + dx;

        if (checkY >= 0 && checkY <= maxY && checkX >= 0 && checkX <= maxX) {
          if (Math.abs(dx) + Math.abs(dy) <= radius + 1) {
            // Просет ромбиком. Если хочешь квадратом - удали этот блок иф
            this.discoveredMap[checkY][checkX] = true;
          }
        }
      }
    }
  }
}
