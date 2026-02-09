// src/scenes/BaseScene.js
import { Container } from 'pixi.js';

export default class BaseScene {
  constructor(ctx) {
    this.ctx = ctx;
    this.container = new Container(); // корневой контейнер сцены
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
