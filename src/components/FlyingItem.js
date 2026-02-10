// src/components/FlyingItem.js
import TftItem from './TftItem.js';
import { Texture } from 'pixi.js';
export default class FlyingItem extends TftItem {
  constructor(item) {
    super(item, 60, 60); // фиксированный размер
    this.reset();
  }

  reset() {
    this.active = false;
    this.visible = false;
    this.interactive = false;
    this.speed = 0;
    this.targetY = 0;
  }

  launch(startX, startY, speed = 2) {
    this.x = startX;
    this.y = startY;
    this.speed = speed;
    this.active = true;
    this.visible = true;
    this.interactive = true;

    // Случайное "дрожание" для живости
    this.targetY = startY + (Math.random() - 0.5) * 100;
    this.wobblePhase = Math.random() * Math.PI * 2;
  }

  update() {
    if (!this.active) return;

    // Движение слева направо? Нет — справа налево!
    this.x -= this.speed; // ← уменьшаем x

    // Вертикальное колебание
    this.wobblePhase += 0.05;
    this.y = this.targetY + Math.sin(this.wobblePhase) * 10;

    // Проверка выхода за левый край
    if (this.x < -this.width) {
      this.deactivate();
      return false; // сигнал "промах"
    }

    return true; // всё ещё активен
  }

  deactivate() {
    this.active = false;
    this.visible = false;
    this.interactive = false;
  }
}
