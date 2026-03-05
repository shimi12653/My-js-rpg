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

// Сгенерированное курсором
// --- STAVES (посохи) ---

export class CinderheartStaff extends FireStaff {
  constructor() {
    super();
    this.name = "Cinderheart Pyre Staff";
    this.baseDamage = 11;
    this.burnChance = 0.5; // чаще горение, урон чуть выше базового посоха
    this.critChance = 0.15;
    this.critMultiplier = 1.5;
  }

  calcDamage() {
    const result = super.calcDamage(); // базовый урон + шанс горения

    if (Math.random() < this.critChance) {
      result.damage = Math.floor(result.damage * this.critMultiplier);
      result.isCrit = true;
    }

    return result;
  }
}

export class AbyssalSoulflameStaff extends FireStaff {
  constructor() {
    super();
    this.name = "Abyssal Soulflame Staff";
    this.baseDamage = 14;
    this.burnChance = 0.35; // реже горение, но сильнее базовый удар
    this.critChance = 0.3;
    this.critMultiplier = 1.8;
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

// --- SWORDS (мечи) ---

export class GrimOathblade extends Sword {
  constructor() {
    super();
    this.name = "Grim Oathblade";
    this.baseDamage = 13; // сильнее деревянного меча
    this.handsRequired = 1;
    this.critChance = 0.35; // чаще криты
    this.critMultiplier = 2.0;
  }
}

export class MoonlitExecutioner extends Sword {
  constructor() {
    super();
    this.name = "Moonlit Executioner";
    this.baseDamage = 16; // очень высокий базовый урон
    this.handsRequired = 1;
    this.critChance = 0.2; // реже, но болезненнее удары
    this.critMultiplier = 2.5;
  }
}

// --- SCYTHES (косы, вампиризм) ---

export class SoulReaperScythe extends Scythe {
  constructor() {
    super();
    this.name = "Soul Reaper Scythe";
    this.baseDamage = 22;
    this.handsRequired = 2;
    this.drainAmount = 0.25; // 25% от нанесённого урона в хил
    this.critChance = 0.25;
    this.critMultiplier = 1.7;
  }
}

export class GraveboundCrescent extends Scythe {
  constructor() {
    super();
    this.name = "Gravebound Crescent";
    this.baseDamage = 18; // поменьше урон
    this.handsRequired = 2;
    this.drainAmount = 0.35; // но больше вампиризм
    this.critChance = 0.2;
    this.critMultiplier = 1.4;
  }
}

// --- DUAL DAGGERS (двойной удар) ---

export class HollowMaskDaggers extends DualDaggers {
  constructor() {
    super();
    this.name = "Hollow Mask Daggers";
    this.baseDamage = 13; // чуть слабее по одному удару
    this.handsRequired = 2;
    this.doubleStrikeChance = 0.4; // чаще двойной удар
    this.critChance = 0.25;
    this.critMultiplier = 1.8;
  }
}

export class VeinrenderTwins extends DualDaggers {
  constructor() {
    super();
    this.name = "Veinrender Twins";
    this.baseDamage = 17; // сильнее по одному удару
    this.handsRequired = 2;
    this.doubleStrikeChance = 0.25; // реже двойной удар
    this.critChance = 0.3;
    this.critMultiplier = 2.0;
  }
}

// --- BOWS (луки, уклонение) ---

export class WhisperingBoneBow extends Bow {
  constructor() {
    super();
    this.name = "Whispering Bone Bow";
    this.baseDamage = 11;
    this.handsRequired = 2;
    this.dodgeChance = 0.3; // лучше шанс уклонения
    this.critChance = 0.3;
    this.critMultiplier = 1.6;
  }
}

export class AshenWraithLongbow extends Bow {
  constructor() {
    super();
    this.name = "Ashen Wraith Longbow";
    this.baseDamage = 14;
    this.handsRequired = 2;
    this.dodgeChance = 0.2; // чуть хуже уклонение
    this.critChance = 0.4; // но высокий шанс крита
    this.critMultiplier = 1.5;
  }
}
