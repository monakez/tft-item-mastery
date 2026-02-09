import ItemDragPanel from '../components/ItemDragPanel.js'
import BaseScene from './BaseScene.js';
import { getRandomCombinedItem, getRecipe } from '../utils/itemUtils.js';
import FlyingItemPool from '../components/FlyingItemPool.js';
import  { GameScene} from './GameScene.js';

export default class RainScene extends GameScene {
  constructor(ctx) {
    super(ctx);
    this.pool = new FlyingItemPool(ctx,this.gameAreaContainer);
    
    // Колбэк при промахе
    this.pool.onMiss =this.onMiss 
    // Обработка кликов по летящим предметам
    this.ctx.app.stage.on('pointerdown', this.onScreenClick, this);

    // Спавн предметов
    this.spawnInterval = setInterval(() => {
      this.spawnFlyingItem();
    }, 1500);
    this.ctx.app.ticker.add(this.update, this);

  }

  onCombine = (comboData) =>{
    console.log('COMBINED')
  }
  onMiss = (flyingItem) => {
    this.misses++;
    
    this.pool.release(flyingItem)
    if (this.misses >= 10) {
      this.endGame();
    }
  };

  endGame = ()=>{
    console.log('GAMEOVER')
  }
  update() {
    this.pool.updateAll(this.ctx.app.ticker.deltaMS);
  }

  spawnFlyingItem() {
    
    const startX = this.ctx.app.screen.width + 50; // за правым краем
    const startY = Math.random() * (this.ctx.app.screen.height - 200) + 100;
    const speed = 1.5 + Math.random() * 1.5;
    
    this.pool.acquire(startX, startY, speed);
  }

  onScreenClick(event) {
    // Проверяем попадание по любому активному предмету
    for (const item of this.pool.activeItems) {
      const dx = event.global.x - item.x;
      const dy = event.global.y - item.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) { // радиус попадания
        this.onHit(item);
        break;
      }
    }
  }

  onHit(flyingItem) {
    // Создаём эффект попадания
    this.createHitEffect(flyingItem.x, flyingItem.y);
    
    // Собираем предмет в инвентарь или проверяем комбинацию
    this.collectedItems.push(flyingItem.item);
    
    // Возвращаем в пул
    this.pool.release(flyingItem);
  }

  createHitEffect(x, y) {
    // Можно добавить частицы, звук и т.д.
    const hitSprite = new Sprite(Texture.WHITE);
    hitSprite.tint = 0x00ff00;
    hitSprite.width = hitSprite.height = 20;
    hitSprite.position.set(x, y);
    hitSprite.alpha = 0.8;
    this.gameAreaContainer.addChild(hitSprite);
    
    setTimeout(() => hitSprite.destroy(), 200);
  }

  update(delta) {
    this.pool.updateAll(delta);
  }

  destroy() {
    clearInterval(this.spawnInterval);
    this.ctx.app.stage.off('pointerdown', this.onScreenClick, this);
    this.ctx.app.ticker.remove(this.update, this);
    this.pool?.destroy();
    super.destroy();
  }
}
