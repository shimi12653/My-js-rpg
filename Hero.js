import { SETTINGS } from "./constants.js";

export class Hero {
  constructor() {
    this.damage = 10;
    this.gold = SETTINGS.STARTING_GOLD;
    this.equippedWeapons = 0;
    this.maxHands = SETTINGS.MAX_HANDS;
    this.hp = 100;
    this.maxHp = SETTINGS.HERO_MAX_HP;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
  }

  heal(amount) {
    this.hp += amount;
    if (this.hp >= this.maxHp) this.hp = this.maxHp;
  }

  // Метод, где берём оружие в руки
  equipWeapon(extraDamage) {
    if (this.equippedWeapons < this.maxHands) {
      this.damage += extraDamage;
      this.equippedWeapons++;
      return true;
    } else {
      return false;
    }
  }

  // Метод получения золота
  addGold(amount) {
    this.gold += amount;
  }

  // Трата золота
  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    } else {
      return false;
    }
  }

  // Метод загрузки данных из созранения
  loadData(data) {
    this.damage = data.damage;
    this.gold = data.gold;
    this.equippedWeapons = data.equippedWeapons;
    this.hp = data.hp ?? 100;
    this.maxHp = data.maxHp ?? 100;
  }
}
