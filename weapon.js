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

// Кинжал теперь наследует плавающий урон!
export class Dagger extends Weapon {
  constructor() {
    super("Rusty Dagger", 10, 1);
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

export class HSword extends Weapon {
  constructor() {
    super("Heavy Sword", 15, 2);
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
