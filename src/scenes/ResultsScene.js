import BaseScene from './BaseScene.js';

export default class ResultsScene extends BaseScene {
  constructor(score, total, timeSpent) {
    super();

    let text = `Результат:\nСчёт: ${score}`;
    if (total) text += `\nТочность: ${Math.round((score / total) * 100)}%`;
    if (timeSpent) text += `\nВремени: ${timeSpent} сек`;

    const resultText = new PIXI.Text(text, {
      fill: 0xffffff,
      fontSize: 28,
      align: 'center'
    });
    resultText.anchor.set(0.5);
    resultText.position.set(GAME.app.screen.width / 2, GAME.app.screen.height / 2 - 50);
    this.container.addChild(resultText);

    this.createButton('В меню', GAME.app.screen.width / 2, GAME.app.screen.height / 2 + 100, () => {
      import('./HomeScene.js').then(m => GAME.goToScene(m.default));
    });
  }
}
