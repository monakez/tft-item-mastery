// src/scenes/MenuScene.js
import BaseScene from './BaseScene.js';
import { Text, TextStyle } from 'pixi.js';

export default class MenuScene extends BaseScene {
  createButton(text, x, y, onClick) {
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center'
    });

    const buttonText = new Text({ text, style });
    buttonText.anchor.set(0.5);
    buttonText.position.set(x, y);
    buttonText.interactive = true;
    buttonText.buttonMode = true;
    buttonText.on('pointertap', onClick);

    this.container.addChild(buttonText);
    return buttonText;
  }
}
