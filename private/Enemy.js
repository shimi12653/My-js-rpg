export class Enemy {
  constructor(name, hp, damage, img) {
    this.name = name;
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.img = img;

    this.burnTurns = 0;
    this.burnDamage = 10; // Можно ставить любой дамаг. Просто так будет более менее эффективно
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
  }
}
