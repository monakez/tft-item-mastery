import { Select } from '@pixi/ui';
import TargetItem from '../components/TargetItem.js';
import { Texture, Text, Sprite, Graphics } from 'pixi.js';
import { GameScene, TARGET_SIZE } from './GameScene.js';
import { ItemSetType } from '@/components/ItemSetType.js';

export default class ForgeScene extends GameScene {
  constructor(ctx) {
    super(ctx);
    this.score = 0;
    this.maxTrials = 10;
    this.draggingSprite = null;
    this.dragOffset = { x: 0, y: 0 };

    this.recipeCounter = {
      ok: 0,
      hitTotal: 0,
      missTotal: 0,
    };
    this.drawUI();
    this.drawTarget();
  }

  getCountString() {
    return `Hit: ${this.recipeCounter.hitTotal} Miss: ${this.recipeCounter.missTotal}`;
  }

  // src/scenes/ForgeScene.js (обновленный drawUI с адаптивностью)
  drawUI() {
    const { width, height } = this.ctx.app.screen;
    const isPortrait = height > width;
    const margin = isPortrait ? 10 : 20;

    const topHeight = this.topHudContainer.height;
    // Текст счета
    this.scoreText = new Text(this.getCountString(), {
      fill: 0xffffff,
      fontSize: isPortrait ? 14 : 18,
    });
    const textY = (topHeight - this.scoreText.height) / 2;
    this.scoreText.position.set(margin, textY);
    this.topHudContainer.addChild(this.scoreText);

    const types = Object.values(ItemSetType);
    const activeIndex = types.findIndex((t) => t.id === this.ctx.activeSetId);

    const itemStyle = { fill: 0x000000, fontSize: isPortrait ? 14 : 18 };

    const selectWidth = isPortrait ? 140 : 200;
    const selectHeight = isPortrait ? 25 : 40;

    const select = new Select({
      closedBG: new Graphics().roundRect(0, 0, selectWidth, selectHeight, 10).fill(0xcccccc),
      openBG: new Graphics().roundRect(0, 0, selectWidth, 200, 10).fill(0xeeeeee),
      textStyle: itemStyle,
      selected: activeIndex,
      items: {
        items: types.map((t) => t.name),
        backgroundColor: 0xeeeeee,
        hoverColor: 0xdddddd,
        width: selectWidth,
        height: selectHeight,
        textStyle: itemStyle,
      },
      scrollBox: {
        width: selectWidth,
        height: 160,
      },
    });

    const selectX = width - selectWidth - margin;
    const selectY = (topHeight - selectHeight) / 2;
    select.position.set(selectX, selectY);

    select.onSelect.connect((index) => {
      const selectedType = types[index]; // Получаем объект {id, name} по индексу

      if (selectedType) {
        this.ctx.selectSet(selectedType.id); // Меняем ID в контексте

        // Теперь this.ctx.currentSet автоматически вернет нужный объект данных
        console.log('Active data:', this.ctx.currentSet);

        this.ctx.goToScene(ForgeScene);
      }
    });

    this.topHudContainer.addChild(select);

    this.ctx.app.ticker.add(() => {
      if (select && select.update) {
        select.update();
      }
    });
  }

  drawTarget() {
    const areaW = this.gameAreaContainer.width;
    const areaH = this.gameAreaContainer.height;

    if (!this.targetItem) {
      // Передаем areaW как maxWidth
      this.targetItem = new TargetItem(
        this.ctx.currentSet.getRandomCombinedItem(),
        TARGET_SIZE,
        areaW,
      );
      this.gameAreaContainer.addChild(this.targetItem);
    } else {
      this.targetItem.update(this.ctx.currentSet.getRandomCombinedItem(), areaW);
    }

    // --- Масштабирование по высоте ---
    this.targetItem.scale.set(1);
    const realHeight = this.targetItem.height;

    if (realHeight > areaH - 20) {
      const scale = (areaH - 20) / realHeight;
      this.targetItem.scale.set(scale);
    }

    // --- Позиционирование ---
    // По X всегда 0, так как контейнер равен ширине экрана
    // Если мы уменьшили масштаб, нужно отцентрировать по X вручную:
    this.targetItem.x = (areaW - areaW * this.targetItem.scale.x) / 2;

    // Центрируем по вертикали
    this.targetItem.y = (areaH - realHeight * this.targetItem.scale.y) / 2;
  }

  findTargetTftItem(combined) {
    if (combined.id !== this.targetItem.item.id) {
      return null;
    }
    return this.targetItem;
  }

  updateCounter() {
    this.scoreText.text = this.getCountString();
  }

  showTemporaryResult(item) {
    // Создаём спрайт результата
    const resultSprite = new Sprite(Texture.from(`/items/${item.icon}`));
    resultSprite.width = 80;
    resultSprite.height = 80;
    resultSprite.position.set(
      this.ctx.app.screen.width / 2 - 40,
      this.ctx.app.screen.height / 2 - 40,
    );
    resultSprite.alpha = 0.9;
    this.container.addChild(resultSprite);

    // Название
    const nameText = new Text(item.name, { fill: 0xffffff, fontSize: 20 });
    nameText.anchor.set(0.5);
    nameText.position.set(this.ctx.app.screen.width / 2, this.ctx.app.screen.height / 2 + 50);
    this.container.addChild(nameText);

    // Удаляем через 1 секунду
    setTimeout(() => {
      resultSprite.destroy();
      nameText.destroy();
    }, 1000);
  }

  onHit(_combinedItem, _targetTftItem) {
    console.log('HIT');
    this.recipeCounter.ok = 0;
    this.recipeCounter.hitTotal++;
    this.updateCounter();
    this.dragPanel.disableGlow();
    this.drawTarget();
    this.dragPanel.drawItems();
  }

  onMiss(_resultItem) {
    console.log('HIT');
    //find 1st item to glow
    this.recipeCounter.missTotal++;
    if (this.recipeCounter.missTotal % 3 === 1) {
      this.dragPanel.glow(this.targetItem.item.recipe[0]);
    }
    if (this.recipeCounter.missTotal % 3 === 2) {
      this.dragPanel.glow(this.targetItem.item.recipe[1]);
    }
    this.updateCounter();
    // this.handleCorrectCombination()
  }
  destroy() {
    if (this.targetItem) {
      this.ctx.app.stage.off('pointermove', this.onDragMove, this);
    }
    super.destroy();
  }
}
