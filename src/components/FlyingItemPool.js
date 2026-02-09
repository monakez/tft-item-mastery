// src/components/FlyingItemPool.js
import FlyingItem from './FlyingItem.js';

export default class FlyingItemPool {
  constructor(ctx, container, size = 20) {
    this.ctx = ctx;
    this.container=container;
    this.pool = [];
    this.activeItems = new Set();
    

    const COMPOSITE_ITEMS = ctx.sets['all'].combo.filter(item => item.recipe && item.recipe.length > 0);
    
    if (COMPOSITE_ITEMS.length===0) {
      throw new Error("BAD CONTEXT ITEMS. NO COMPOSITE RECIPES")
    }
    // Предварительное создание объектов
    for (let i = 0; i < size; i++) {
      const itemData = COMPOSITE_ITEMS[ i % COMPOSITE_ITEMS.length];
      const flyingItem = new FlyingItem(itemData);
      this.container.addChild(flyingItem);
      this.pool.push(flyingItem);
    }
  }
  acquire(startX, startY, speed) {
    const inactive = this.pool.find(item => !item.active);
    if (inactive) {
      inactive.launch(startX, startY, speed);
      this.activeItems.add(inactive);
      return inactive;
    }
    return null;
  }

  updateAll() {
    for (const item of this.activeItems) {
      const stillActive = item.update();
      if (!stillActive) {
        this.release(item);
        this.onMiss?.(item);
      }
    }
  }

  release(item) {
    item.deactivate();
    this.activeItems.delete(item);
  }

  checkHit(compositeId) {
    for (const target of this.activeItems) {
      if (target.isMatch(compositeId)) {
        this.release(target);
        return true;
      }
    }
    return false;
  }

  destroy() {
    for (const item of this.pool) {
      item.destroy();
    }
    this.pool = [];
    this.activeItems.clear();
  }
}
