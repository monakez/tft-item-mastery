// src/components/ItemDragPanel.js
import { Point, Sprite, Texture, Container } from 'pixi.js';
import TftItem from '../components/TftItem.js';
import { GlowFilter } from 'pixi-filters';

export default class ItemDragPanel extends Container {
  constructor(ctx, onCombine) {
    super();
    this.ctx = ctx;
    this.onCombine = onCombine;
    this.draggingSprite = null;
    this.dragOffset = { x: 0, y: 0 };
    this.baseSprites = [];
    this.drawItems();
    this.disableGlow();
  }

  glow(id) {
    const toGlow = this.baseSprites.filter((pred) => {
      return pred?.item?.id === id && pred?.glow?.outerStrength === 0;
    });
    if (toGlow[0]?.glow) {
      toGlow[0].glow.outerStrength = 2;
    }
  }

  disableGlow() {
    this.baseSprites.forEach((s) => {
      s.glow.outerStrength = 0;
    });
  }

  drawItems() {
    const baseItems = this.ctx.currentSet?.base || [];
    const shuffledPairs = [...baseItems, ...baseItems].sort(() => Math.random() - 0.5);

    // Адаптивные параметры
    const containerWidth = this.parent?.width || this.ctx.app.screen.width;
    const containerHeight = this.parent?.height || this.ctx.app.screen.height * 0.4;
    const isPortrait = this.ctx.app.screen.height > this.ctx.app.screen.width;

    // Размер элемента адаптируется под экран
    const maxSize = isPortrait ? 60 : 70;
    const spacing = isPortrait ? 10 : 15;

    // Определяем количество колонок и рядов в зависимости от ориентации
    let cols, rows;
    if (isPortrait) {
      // Портретная ориентация: 3-4 колонки, больше рядов
      cols = Math.min(4, Math.ceil(Math.sqrt(shuffledPairs.length)));
      rows = Math.ceil(shuffledPairs.length / cols);
    } else {
      // Ландшафтная ориентация: 2 ряда, больше колонок
      rows = 2;
      cols = Math.ceil(shuffledPairs.length / rows);
    }

    // Рассчитываем размер с учетом доступного пространства
    const maxItemWidth = (containerWidth - (cols + 1) * spacing) / cols;
    const maxItemHeight = (containerHeight - (rows + 1) * spacing) / rows;
    const size = Math.min(maxSize, maxItemWidth, maxItemHeight);

    // Центрируем сетку
    const gridWidth = cols * size + (cols - 1) * spacing;
    const gridHeight = rows * size + (rows - 1) * spacing;
    const startX = (containerWidth - gridWidth) / 2;
    const startY = (containerHeight - gridHeight) / 2;

    // Очищаем старые спрайты
    this.baseSprites.forEach((s) => {
      s.off();
      s.destroy({ children: true, texture: false });
    });
    this.baseSprites = [];

    shuffledPairs.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (size + spacing);
      const y = startY + row * (size + spacing);

      const sprite = new TftItem(item, size, size).makeInteractive().setPosition(x, y);

      sprite.originalX = x;
      sprite.originalY = y;

      sprite
        .on('pointerdown', this.onDragStart, this)
        .on('globalpointermove', this.onDragMove, this)
        .on('pointerup', this.onDragEnd, this)
        .on('pointerupoutside', this.onDragEnd, this);

      this.addChild(sprite);
      this.baseSprites.push(sprite);

      this.applyGlowFilter(sprite);
    });
  }

  applyGlowFilter(sprite) {
    const glow = new GlowFilter({
      distance: 5,
      outerStrength: 0,
      innerStrength: 0,
      color: 0x007700,
      quality: 1,
    });
    sprite.glow = glow;
    sprite.filters = [glow];
  }

  onDragStart(event) {
    const sprite = event.currentTarget;
    this.draggingSprite = sprite;
    this.dragOffset = {
      x: event.global.x - sprite.x,
      y: event.global.y - sprite.y,
    };
    sprite.cursor = 'grabbing';
    sprite.alpha = 0.8;
    this.addChild(sprite);
  }

  onDragMove(event) {
    if (!this.draggingSprite) return;
    this.draggingSprite.x = event.global.x - this.dragOffset.x;
    this.draggingSprite.y = event.global.y - this.dragOffset.y;
  }

  onDragEnd() {
    if (!this.draggingSprite) return;

    const dragged = this.draggingSprite;
    dragged.alpha = 1.0;
    dragged.cursor = 'grab';

    let dropTarget = null;
    for (const other of this.baseSprites) {
      if (other !== dragged && this.isColliding(dragged, other)) {
        dropTarget = other;
        break;
      }
    }
    this.draggingSprite = null;

    if (!dropTarget) {
      dragged.x = dragged.originalX;
      dragged.y = dragged.originalY;
      return;
    }

    const dropPoint = new Point((dragged.x + dropTarget.x) / 2, (dragged.y + dropTarget.y) / 2);
    const globalDropPos = this.toGlobal(dropPoint);
    const combinedPosition = {
      x: globalDropPos.x,
      y: globalDropPos.y,
    };
    const found = this.combineItems(dragged.item, dropTarget.item);

    dragged.x = dragged.originalX;
    dragged.y = dragged.originalY;

    if (this.onCombine && found) {
      this.onCombine({
        itemA: dragged.item,
        itemB: dropTarget.item,
        result: found,
        position: combinedPosition,
      });
    }
  }

  isColliding(a, b) {
    const aBounds = a.getBounds();
    const bBounds = b.getBounds();

    return (
      aBounds.x + aBounds.width > bBounds.x &&
      aBounds.x < bBounds.x + bBounds.width &&
      aBounds.y + aBounds.height > bBounds.y &&
      aBounds.y < bBounds.y + bBounds.height
    );
  }

  combineItems(itemA, itemB) {
    const recipe = [itemA.id, itemB.id].sort();
    const foundItem =
      this.ctx.currentSet.findItemByRecipe(recipe) || this.ctx.sets['all'].findItemByRecipe(recipe);
    if (!foundItem) {
      throw new Error('recipe not found');
    }
    return foundItem;
  }

  destroy() {
    super.destroy({ children: true });
  }
}
