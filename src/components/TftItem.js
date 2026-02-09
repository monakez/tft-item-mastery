import { Sprite, Texture } from 'pixi.js';

export default class TftItem extends Sprite {
  constructor(item, width = 64, height = 64) {
    // Создаем спрайт с пустой текстурой
    super(Texture.EMPTY);
    
    this.item = item;
    this.width = width;
    this.height = height;

    // Загружаем реальную текстуру
    this.texture = Texture.from(`/items/${item.icon}`);
    
    // Центрирование (опционально)
    // this.anchor.set(0.5);
  }

    // Inside your TftItem class
  updateData(newItem) {
    this.item = newItem; // Update the reference to the data object

    // 1. Update the texture
    // If you use Assets.get() or Texture.from()
    this.texture = Texture.from(`/items/${newItem.icon}`);

    // 2. Optional: Adjust scaling if icons have different sizes
    // this.sprite.width = this.targetWidth;
    // this.sprite.height = this.targetHeight;

    // 3. Reset effects
    // If the previous item was "glowing", you probably want to reset it
    if (this.glow) {
      this.glow.outerStrength = 0;
    }
  }

  setPosition(x, y) {
    this.position.set(x, y);
    return this;
  }

  makeInteractive() {
    this.interactive = true;
    this.cursor = 'pointer';
    return this;
  }
}
