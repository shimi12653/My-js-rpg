import { Hero } from "./Hero.js";
import { Enemy } from "./Enemy.js";
import { GAME_STATE } from "./constants.js";
import { ITEMS } from "./constants.js";

export class Game {
  constructor() {
    this.level = 1;
    this.hero = new Hero();
    this.enemies = [];
    this.currentEnemy = null;
    this.state = GAME_STATE.PLAYING;
    this.isProccessingTurn = false;
    this.inventory = [];
  }

  reset() {
    this.level = 1;
    this.hero = new Hero();

    this.inventory = [];
    this.inventory.push(ITEMS.SWORD);

    this.state = GAME_STATE.PLAYING;
    this.isProccessingTurn = false;
  }
}
