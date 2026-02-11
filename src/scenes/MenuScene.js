// src/scenes/MenuScene.js
import { Text, TextStyle, Graphics } from 'pixi.js';
import { Button } from '@pixi/ui';
import BaseScene from './BaseScene.js';

export default class MenuScene extends BaseScene {
  createButton(text, x, y, onClick) {
    // 1. Создаем визуальную составляющую (фон кнопки)
    const background = new Graphics()
      .roundRect(0, 0, 200, 50, 10)
      .fill({ color: 0x333333, alpha: 0.8 });

    // 2. Создаем текст
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
    });
    const buttonText = new Text({ text, style });
    buttonText.anchor.set(0.5);
    // Центрируем текст внутри фона (200/2, 50/2)
    buttonText.position.set(100, 25);

    // 3. Собираем всё в один контейнер-представление
    background.addChild(buttonText);

    // 4. Инициализируем компонент Button из @pixi/ui
    const button = new Button(background);

    // Настраиваем позицию самой кнопки
    button.view.position.set(x - 100, y - 25); // Центрируем по переданным координатам

    // Добавляем событие клика
    button.onPress.connect(onClick);

    // Добавляем простую анимацию при наведении (опционально)
    button.onHover.connect(() => {
      background.tint = 0x555555;
    });
    button.onOut.connect(() => {
      background.tint = 0xffffff;
    });

    this.container.addChild(button.view);
    return button;
  }
}
