import { Hero } from "./Hero.js";
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
}
