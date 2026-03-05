// Базовый класс для ВСЕГО оружия
export class Weapon {
  constructor(name, baseDamage, handsRequired) {
    this.name = name;
    this.baseDamage = baseDamage;
    this.handsRequired = handsRequired;
  }

  calcDamage() {
    const variance = 0.2;
    const min = Math.ceil(this.baseDamage * (1 - variance));
    const max = Math.floor(this.baseDamage * (1 + variance));

    const finalDamage = Math.floor(Math.random() * (max - min + 1)) + min;

    return { damage: finalDamage, isCrit: false };
  }
}

export class FireStaff extends Weapon {
  constructor() {
    super("Fire Staff", 8, 2);
    this.burnChance = 0.4;
  }

  calcDamage() {
    const result = super.calcDamage();

    if (Math.random() < this.burnChance) {
      result.effect = "burn";
    }

    return result;
  }
}

export class Sword extends Weapon {
  constructor() {
    super("Wooden Sword", 10, 1);
    this.critChance = 0.3;
    this.critMultiplier = 2.0;
  }

  calcDamage() {
    const result = super.calcDamage();

    if (Math.random() < this.critChance) {
      result.damage = Math.floor(result.damage * this.critMultiplier);
      result.isCrit = true;
    }

    return result;
  }
}

export class Scythe extends Weapon {
  constructor() {
    super("Iron Scythe", 20, 2);
    this.drainAmount = 0.2;
    this.critChance = 0.3;
    this.critMultiplier = 1.5;
  }

  calcDamage() {
    const result = super.calcDamage();

    if (Math.random() < this.critChance) {
      result.damage = Math.floor(result.damage * this.critMultiplier);
      result.isCrit = true;
    }

    result.drain = Math.floor(result.damage * this.drainAmount);

    return result;
  }
}

export class DualDaggers extends Weapon {
  constructor() {
    super("Dual Daggers", 15, 2);
    this.doubleStrikeChance = 0.3;
    this.critChance = 0.2;
    this.critMultiplier = 2.0;
  }

  calcDamage() {
    const result = super.calcDamage();

    if (Math.random() < this.critChance) {
      result.damage = Math.floor(result.damage * this.critMultiplier);
      result.isCrit = true;
    }

    if (Math.random() < this.doubleStrikeChance) {
      const secondHit = super.calcDamage();

      if (Math.random() < this.critChance) {
        secondHit.damage = Math.floor(secondHit.damage * this.critMultiplier);
        secondHit.isCrit = true;
        result.isCrit = true;
      }

      result.damage += secondHit.damage;
      result.isDoubleStrike = true;
    }

    return result;
  }
}

export class Bow extends Weapon {
  constructor() {
    super("Wooden Bow", 10, 2);
    this.dodgeChance = 0.25; // Будет вызван при ударе врага
    this.critChance = 0.4;
    this.critMultiplier = 1.5;
  }

  calcDamage() {
    const result = super.calcDamage();

    if (Math.random() < this.critChance) {
      result.damage = Math.floor(result.damage * this.critMultiplier);
      result.isCrit = true;
    }

    return result;
  }
}
