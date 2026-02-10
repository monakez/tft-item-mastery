import { Container, Text } from 'pixi.js';
import TftItem from './TftItem.js';

export default class TargetItem extends Container {
  constructor(item, targetSize) {
    super();
    this.targetSize = targetSize;
    this.item = item;

    // Создаем спрайт предмета
    this.sprite = new TftItem(item, targetSize, targetSize);
    this.addChild(this.sprite);

    // Создаем текстовые объекты один раз
    const textStyle = { fill: 0xffffff, fontSize: 20 };

    this.nameText = new Text(item.name, textStyle);
    this.nameText.anchor.set(0.5);
    this.nameText.position.set(48, 110); // Относительные координаты внутри контейнера

    this.descText = new Text(item.description, textStyle);
    this.descText.anchor.set(0.5);
    this.descText.position.set(48, 140);

    this.addChild(this.nameText);
    this.addChild(this.descText);
  }

  // Метод для обновления данных без пересоздания объекта
  update(newItem) {
    this.sprite.updateData?.(newItem); // Предполагаем, что у TftItem есть метод обновления
    this.nameText.text = newItem.name;
    this.descText.text = newItem.description;
    this.item = newItem;
  }

  // Управление видимостью деталей
  showDetails(showName = true, showDesc = true) {
    this.nameText.visible = showName;
    this.descText.visible = showDesc;
  }
}
