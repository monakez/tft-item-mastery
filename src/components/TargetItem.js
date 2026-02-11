import { Container, Graphics, Text } from 'pixi.js';
import TftItem from './TftItem.js';

export default class TargetItem extends Container {
  constructor(item, targetSize, maxWidth) {
    // Добавили maxWidth
    super();
    this.label = 'Target Item';
    this.targetSize = targetSize;
    this.item = item;
    const padding = 20; // Отступы по бокам

    // 1. Спрайт (центрируем его локально относительно maxWidth)
    this.sprite = new TftItem(item, targetSize, targetSize);
    this.sprite.x = (maxWidth - targetSize) / 2;
    this.addChild(this.sprite);

    // 2. Стиль текста с переносом на всю ширину
    const dynamicFontSize = Math.max(14, Math.floor(targetSize * 0.18));
    const textStyle = {
      fill: 0xffffff,
      fontSize: dynamicFontSize,
      wordWrap: true,
      wordWrapWidth: maxWidth - padding * 2, // Текст на всю ширину минус отступы
      align: 'center',
    };

    // 3. Текст имени
    this.nameText = new Text(item.name, textStyle);
    this.nameText.anchor.set(0.5, 0);
    // X — середина maxWidth, Y — под спрайтом
    this.nameText.position.set(maxWidth / 2, targetSize + 10);

    // 4. Текст описания
    this.descText = new Text(item.description, {
      ...textStyle,
      fontSize: dynamicFontSize * 0.8,
      fill: 0xcccccc, // чуть тусклее для иерархии
    });
    this.descText.anchor.set(0.5, 0);

    this.addChild(this.nameText, this.descText);
    this.updateTextPositions(maxWidth);
  }

  updateTextPositions(maxWidth) {
    const spacing = 6;
    const centerX = maxWidth / 2;

    this.nameText.x = centerX;
    this.descText.x = centerX;
    this.descText.y = this.nameText.y + this.nameText.height + spacing;
  }

  update(newItem, maxWidth) {
    this.item = newItem;
    if (this.sprite.updateData) this.sprite.updateData(newItem);

    this.nameText.text = newItem.name;
    this.descText.text = newItem.description;

    this.updateTextPositions(maxWidth);
  }
  /**
   * Возвращает глобальные координаты (x, y) верхнего левого угла иконки.
   * Используется для анимации полета предметов к цели.
   */
  getGlobalPosition() {
    // toGlobal({x:0, y:0}) берет верхний левый угол спрайта
    // и переводит его в координаты экрана (Stage).
    return this.sprite.toGlobal({ x: 0, y: 0 });
  }

  // Если вдруг понадобится центр иконки для другой анимации:
  getCenterGlobalPosition() {
    return this.sprite.toGlobal({
      x: this.targetSize / 2,
      y: this.targetSize / 2,
    });
  }
}
