import { SETTINGS } from "./constants.js";

export class Hero {
  constructor() {
    this.damage = 5;
    this.gold = SETTINGS.STARTING_GOLD;
    this.equippedWeapons = 0;
    this.maxHands = SETTINGS.MAX_HANDS;
    this.hp = 100;
    this.maxHp = SETTINGS.HERO_MAX_HP;
    this.weapons = []; // Массив для счёта оружия
    this.mana = SETTINGS.HERO_MAX_MANA;
    this.maxMana = SETTINGS.HERO_MAX_MANA;
    this.armor = 0;
    this.equippedArmor = null;

    // Навигация в матрице
    this.x = 1;
    this.y = 1;
  }

  takeDamage(amount) {
    let reducedDamage = Math.floor(amount * (1 - this.armor / 100));
    reducedDamage = Math.max(1, reducedDamage); // Защита от бесмертия (урон не может быть меньше 1)
    this.hp -= reducedDamage;

    if (this.hp < 0) this.hp = 0;
    return reducedDamage;
  }

  heal(amount) {
    this.hp += amount;
    if (this.hp >= this.maxHp) this.hp = this.maxHp;
  }

  // Метод, где берём оружие в руки
  equipWeapon(weaponObject) {
    if (this.equippedWeapons + weaponObject.handsRequired <= this.maxHands) {
      this.weapons.push(weaponObject); // помещаем оружие в инвентарь
      this.damage += weaponObject.baseDamage; // увеличиваем дамаг героя
      this.equippedWeapons += weaponObject.handsRequired; // оружие занимает в руках место
      return true;
    } else {
      return false;
    }
  }

  // Метод для брони
  equipArmor(armorValue) {
    this.armor = armorValue;
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
