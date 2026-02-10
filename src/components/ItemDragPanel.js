import { Point, Sprite, Texture, Container } from 'pixi.js';
import TftItem from '../components/TftItem.js';
import { GlowFilter } from 'pixi-filters';

export default class ItemDragPanel extends Container {
  constructor(ctx, onCombine) {
    super();
    this.ctx = ctx;
    this.onCombine = onCombine; // колбэк: (itemA, itemB) => {}
    this.draggingSprite = null;
    this.dragOffset = { x: 0, y: 0 };
    this.baseSprites = [];
    this.drawItems();
    this.disableGlow();
  }

  glow(id) {
    const toGlow = this.baseSprites.filter((pred) => {
      //get all with matching id and not glow
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
    const size = 70;
    const spacing = 15;
    const rows = 2;
    const cols = Math.ceil(shuffledPairs.length / rows);

    const containerWidth = this.parent?.width || this.ctx.app.screen.width;
    const startX = (containerWidth - (cols * (size + spacing) - spacing)) / 2;
    const startY = 0;
    this.baseSprites.forEach((s) => {
      s.off();
      s.destroy({ children: true, texture: false });
    });

    this.baseSprites = [];

    shuffledPairs.forEach((item, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const x = startX + col * (size + spacing);
      const y = startY + row * (size + spacing);

      const sprite = new TftItem(item, size, size).makeInteractive().setPosition(x, y);

      // Сохраняем исходные координаты
      sprite.originalX = x;
      sprite.originalY = y;

      // Добавляем обработчики событий
      sprite
        .on('pointerdown', this.onDragStart, this)
        .on('globalpointermove', this.onDragMove, this)
        .on('pointerup', this.onDragEnd, this)
        .on('pointerupoutside', this.onDragEnd, this);

      this.addChild(sprite);
      this.baseSprites.push(sprite);

      // Применяем GlowFilter ПОСЛЕ загрузки текстуры
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
    // glow.padding = 20;
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
    this.addChild(sprite); // поднять наверх
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

    // Проверяем дроп
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
