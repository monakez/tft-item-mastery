// src/scenes/GameScene.js
import TftItem from '../components/TftItem.js'
import BaseScene from './BaseScene.js';
import { Container, Graphics } from 'pixi.js';
import ItemDragPanel from '../components/ItemDragPanel.js';

export const TARGET_SIZE=96;

export class GameScene extends BaseScene {
  constructor(ctx) {
    super(ctx);
    
    // Создаём подконтейнеры
    this.hudContainer = new Container();
    this.gameAreaContainer = new Container();
    
    this.container.addChild(this.hudContainer, this.gameAreaContainer);
    this.gameArea = {
      x: 0,
      y: 0,
      width: this.ctx.app.screen.width,
      height: this.ctx.app.screen.height * 0.8
    };
    
    const { width, height } = ctx.app.screen;
    // 🔥 Фон игровой зоны (верх 80% экрана)
    const gameBg = new Graphics()
      .rect(0, 0, this.gameArea.width, this.gameArea.height)
      .fill({ color: 0x1a1a2e, alpha: 0.7 }); // тёмно-синий
    const divider = new Graphics()
      .moveTo(0, this.gameArea.height)
      .lineTo(this.gameArea.width, this.gameArea.height)
      .stroke({ width: 2, color: 0x444466 });

    this.gameAreaContainer.addChild(gameBg, divider);
    // 🔥 Фон HUD (нижние 20% экрана)
    const hudBg = new Graphics()
      .rect(0, height * 0.8, width, height * 0.2)
      .fill({ color: 0x16213e, alpha: 0.9 }); // тёмно-синий с оттенком
    this.hudContainer.addChild(hudBg);

    // Общий HUD
    this.createCommonHud();
    this.hudContainer.y = height * 0.8;
  }

  createCommonHud() {
    this.dragPanel = new ItemDragPanel(this.ctx,(data)=>this.onCombine(data));
    this.hudContainer.addChild(this.dragPanel);
  }
  onCombine(comboData) {
    // Создаём спрайт результата В ИГРОВОЙ ЗОНЕ
    const resultSprite = new TftItem(comboData.result,TARGET_SIZE,TARGET_SIZE);
    // resultSprite.anchor.set(0.5);
    
    // Устанавливаем НАЧАЛЬНУЮ позицию = точка дропа (глобальные координаты)
    resultSprite.x = comboData.position.x;
    resultSprite.y = comboData.position.y;
    
    // Добавляем в игровую зону
    this.gameAreaContainer.addChild(resultSprite);
    // Находим цель в игровой зоне
    const target = this.findTargetTftItem(comboData.result); // реализуйте этот метод
    
    if (target) {
      const gp=target.getGlobalPosition()
      this.animateToTarget(resultSprite,
        () => ({ x: gp.x, y: gp.y }),
        () => this.onHit(comboData.result, target),
      );
    } else {
      this.animateToTarget(resultSprite,
        () => ({ x: 0, y: 0 }),
        () => this.onMiss(comboData.result)
      );
    }
  }


animateToTarget(sprite, targetPosCallback, doneCallback) {
  let currentSpeed = 0; // Начальная скорость
  const acceleration = 0.02; // Величина ускорения (пикселей в мс^2)
  const maxSpeed = 1.5; // Ограничение максимальной скорости
  
  const animate = () => {
    const deltaMS = this.ctx.app.ticker.deltaMS;
    
    // 1. Увеличиваем скорость со временем
    currentSpeed = Math.min(currentSpeed + acceleration * deltaMS, maxSpeed);
    
    // 2. Получаем актуальную позицию цели
    const currentTarget = targetPosCallback();
    const targetX = currentTarget.x;
    const targetY = currentTarget.y;
    
    // 3. Рассчитываем вектор до цели
    const dx = targetX - sprite.x;
    const dy = targetY - sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Расстояние, которое пройдем в этом кадре
    const moveDistance = currentSpeed * deltaMS;
    
    if (distance <= moveDistance && distance > 0) {
      // Достигли цели
      sprite.x = targetX;
      sprite.y = targetY;
      this.ctx.app.ticker.remove(animate);
      doneCallback();
      
      setTimeout(() => {
        if (sprite.parent) sprite.destroy();
      }, 100);
    } else {
      // 4. Двигаемся в направлении цели
      // Используем нормализованный вектор (направление), умноженный на текущую скорость
      const ratio = moveDistance / distance;
      sprite.x += dx * ratio;
      sprite.y += dy * ratio;

      // Опционально: поворачиваем спрайт по направлению движения
      // sprite.rotation = Math.atan2(dy, dx);
    }
  };

  this.ctx.app.ticker.add(animate);
}


  onHit(combinedItem,targetTftItem) {
    console.log('onHit')
  }
  onMiss() {
    console.log('onMiss')
  }

  findTargetTftItem(comboItem) {
    return null
  }
}
