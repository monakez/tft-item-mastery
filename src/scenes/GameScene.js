// src/scenes/GameScene.js
import TftItem from '../components/TftItem.js';
import BaseScene from './BaseScene.js';
import { Container, Graphics } from 'pixi.js';
import ItemDragPanel from '../components/ItemDragPanel.js';

export const TARGET_SIZE = 96;

export class GameScene extends BaseScene {
  constructor(ctx) {
    super(ctx);

    const { width, height } = ctx.app.screen;
    const isPortrait = height > width;
    const ratio = isPortrait ? 0.3 : 0.5;

    // 1. Задаем фиксированную высоту для верхнего контейнера
    const topHeight = 40;
    // 2. Вычисляем доступную высоту для оставшихся частей
    const availableHeight = height - topHeight;

    this.topHudContainer = new Container();
    this.topHudContainer.label = 'Top HUD';
    this.gameAreaContainer = new Container();
    this.gameAreaContainer.label = 'Game Area';
    this.hudContainer = new Container();
    this.hudContainer.label = 'Bottom HUD';

    this.container.addChild(this.gameAreaContainer, this.hudContainer, this.topHudContainer);

    // --- Настройка Top HUD ---
    this.topHudContainer.y = 0;
    const topBg = new Graphics().rect(0, 0, width, topHeight).fill({ color: 0x0f0f1b, alpha: 1 });
    this.topHudContainer.addChild(topBg);

    // --- Настройка Game Area ---
    const gameHeight = availableHeight * ratio;
    this.gameAreaContainer.y = topHeight; // Ставим сразу после topHud

    const gameBg = new Graphics()
      .rect(0, 0, width, gameHeight)
      .fill({ color: 0x1a1a2e, alpha: 0.7 });

    const divider = new Graphics()
      .moveTo(0, gameHeight)
      .lineTo(width, gameHeight)
      .stroke({ width: 2, color: 0x444466 });

    this.gameAreaContainer.addChild(gameBg, divider);

    // --- Настройка Main HUD ---
    const hudHeight = availableHeight * (1 - ratio);
    this.hudContainer.y = topHeight + gameHeight; // Ставим после игры

    const hudBg = new Graphics().rect(0, 0, width, hudHeight).fill({ color: 0x16213e, alpha: 0.9 });
    this.hudContainer.addChild(hudBg);

    // Сохраняем размеры для логики, если нужно
    this.gameArea = { x: 0, y: topHeight, width, height: gameHeight };

    this.createCommonHud();
  }

  createCommonHud() {
    this.dragPanel = new ItemDragPanel(this.ctx, (data) => this.onCombine(data));
    this.hudContainer.addChild(this.dragPanel);
  }

  onCombine(comboData) {
    const comboSprite = new TftItem(comboData.result, TARGET_SIZE, TARGET_SIZE);
    const localPos = this.gameAreaContainer.toLocal(comboData.position);
    comboSprite.x = localPos.x;
    comboSprite.y = localPos.y;
    comboSprite.label = 'Combo item';

    this.gameAreaContainer.addChild(comboSprite);
    comboSprite.zIndex = 1000;
    const target = this.findTargetTftItem(comboData.result);
    if (target) {
      this.animateToTarget(
        comboSprite,
        () => {
          // Получаем глобальную позицию target
          const globalPos = target.getGlobalPosition();
          // Конвертируем в локальные координаты gameAreaContainer
          const localTarget = this.gameAreaContainer.toLocal(globalPos);

          // Если у target.sprite есть anchor, учитываем его
          // Чтобы центр летел в центр, а не угол в угол
          const offsetX = target.sprite.width * target.sprite.anchor.x;
          const offsetY = target.sprite.height * target.sprite.anchor.y;

          return {
            x: localTarget.x + offsetX,
            y: localTarget.y + offsetY,
          };
        },
        () => {
          this.onHit(comboData.result, target);
        },
      );
    } else {
      this.animateToTarget(
        comboSprite,
        () => ({ x: 0, y: 0 }),
        () => this.onMiss(comboData.result),
      );
    }
  }

  animateToTarget(sprite, targetPosCallback, doneCallback) {
    let currentSpeed = 0;
    const acceleration = 0.02;
    const maxSpeed = 1.5;

    const animate = () => {
      const deltaMS = this.ctx.app.ticker.deltaMS;
      currentSpeed = Math.min(currentSpeed + acceleration * deltaMS, maxSpeed);

      const currentTarget = targetPosCallback();
      const targetX = currentTarget.x;
      const targetY = currentTarget.y;

      const dx = targetX - sprite.x;
      const dy = targetY - sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const moveDistance = currentSpeed * deltaMS;
      // Условие достижения цели
      if (distance <= moveDistance) {
        sprite.x = targetX;
        sprite.y = targetY;

        this.ctx.app.ticker.remove(animate);
        // Ждём СЛЕДУЮЩИЙ кадр рендера, затем вызываем callback
        this.ctx.app.ticker.addOnce(() => {
          doneCallback();

          setTimeout(() => {
            if (sprite.parent) sprite.destroy();
          }, 100);
        });
      } else {
        // Продолжаем движение
        const ratio = moveDistance / distance;
        const oldX = sprite.x;
        const oldY = sprite.y;

        sprite.x += dx * ratio;
        sprite.y += dy * ratio;

        console.log(
          `  Moved from (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) to (${sprite.x.toFixed(2)}, ${sprite.y.toFixed(2)})`,
        );
      }
    };

    this.ctx.app.ticker.add(animate);
  }

  onHit(_combinedItem, _targetTftItem) {
    console.log('onHit');
  }

  onMiss() {
    console.log('onMiss');
  }

  findTargetTftItem(_comboItem) {
    return null;
  }
}
