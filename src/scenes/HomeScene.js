import {Text} from 'pixi.js'

import MenuScene from './MenuScene.js';

export default class HomeScene extends MenuScene {
  constructor(ctx) {
    super(ctx);

    const title = new Text({text: 'TFT Item Mastery', style:{
      fontSize: 36,
      fill: 0xffffff,
      align: 'center'
    }});
    title.anchor.set(0.5);
    title.position.set(this.ctx.app.screen.width / 2, 100);
    this.container.addChild(title);

    const cx = this.ctx.app.screen.width / 2;
    const yStart = 200;
    const dy = 60;

    this.createButton('Forge', cx, yStart, () => this.ctx.goToScene(ForgeScene));
    // this.createButton('Град предметов', cx, yStart + dy, () => this.ctx.goToScene(RainScene));
    // this.createButton('Справочник', cx, yStart + 2 * dy, () => alert('Позже'));
  }
}

// Динамический импорт, чтобы избежать циклических зависимостей
let ForgeScene, RainScene;
import('./ForgeScene.js').then(m => ForgeScene = m.default);
import('./RainScene.js').then(m => RainScene = m.default);
