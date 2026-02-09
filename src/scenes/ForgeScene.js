import { Select } from '@pixi/ui';
import TftItem from '../components/TftItem.js'
import TargetItem from '../components/TargetItem.js'
import ItemDragPanel from '../components/ItemDragPanel.js'
import { Texture, Text, Sprite, Graphics } from 'pixi.js';
import BaseScene from './BaseScene.js';
import {GameScene, TARGET_SIZE} from './GameScene.js';

export default class ForgeScene extends GameScene {
  constructor(ctx) {
    super(ctx);
    this.score = 0;
    this.maxTrials = 10;
    this.draggingSprite = null;
    this.dragOffset = { x: 0, y: 0 };

    this.recipeCounter ={
      ok:0,
      hitTotal:0,
      missTotal:0
    }
    this.drawUI();
    this.drawTarget();
  }

  getCountString() {
    return `Hit: ${this.recipeCounter.hitTotal} Miss: ${this.recipeCounter.missTotal}`;
  }

  drawUI() {
      // Ваш существующий текст счета
      this.scoreText = new Text(this.getCountString(), { fill: 0xffffff, fontSize: 18 });
      this.scoreText.position.set(20, 20);
      this.hudContainer.addChild(this.scoreText);

      // 1. Настройка стиля текста для списка
      const itemStyle = { fill: 0x000000, fontSize: 20 };

      const onSelectCallback =[
        {
          name:'Base Combo items',
          cb:()=>{
            this.ctx.currentSet=this.ctx.sets['base']
          }
        },
        {
          name:'Emblem Combo items',
          cb:()=>{
            this.ctx.currentSet=this.ctx.sets['emblem']
          }
        },
        {
          name:'All Combo items',
          cb:()=>{
            this.ctx.currentSet=this.ctx.sets['all']
          }
        }
      ];
      // 2. Создаем компонент Select
      const select = new Select({
          // Фон закрытого состояния
          closedBG: new Graphics().roundRect(0, 0, 200, 40, 10).fill(0xcccccc),
          // Фон открытого состояния (на 5 элементов вниз)
          openBG: new Graphics().roundRect(0, 0, 200, 200, 10).fill(0xeeeeee),
          textStyle: itemStyle,
          items: {
              items: onSelectCallback.map(o=>o.name),
              backgroundColor: 0xeeeeee,
              hoverColor: 0xdddddd,
              width: 200,
              height: 40,
              textStyle: itemStyle,
          },
          scrollBox: {
              width: 200,
              height: 160, // Высота видимой части выпадающего списка
          }
      });

      select.position.set(20, 60);

      // 3. Обработка выбора
      select.onSelect.connect((index, text) => {
          const item = onSelectCallback.find(obj => obj.name === text);
          if (item && item.cb) {
            item.cb()
            this.ctx.goToScene(ForgeScene)
          }
      });

      this.hudContainer.addChild(select);

      // 4. КРИТИЧНО: Чтобы работал ScrollBox внутри Select
      this.ctx.app.ticker.add(() => {
          if (select && select.update) {
              select.update(); 
          }
      });
  }

  drawTarget() {
    if (!this.targetItem) {
      this.targetItem=new TargetItem(this.ctx.currentSet.getRandomCombinedItem(),TARGET_SIZE)
      this.targetItem.position.set(this.ctx.app.screen.width / 2 - 48,100);
    this.gameAreaContainer.addChild(this.targetItem);
    } else {
      this.targetItem.update(this.ctx.currentSet.getRandomCombinedItem())

    }
  }


  findTargetTftItem(combined) {
    if (combined.id !== this.targetItem.item.id) {
      return null
    }
    return this.targetItem.sprite
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
      this.ctx.app.screen.height / 2 - 40
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

  onHit(combinedItem,targetTftItem) {
    this.recipeCounter.ok=0;
    this.recipeCounter.hitTotal++;
    this.updateCounter()
    this.dragPanel.disableGlow()
    this.drawTarget()
    this.dragPanel.drawItems()
  }

  onMiss(resultItem) {
    //find 1st item to glow
    this.recipeCounter.missTotal++;
    if (this.recipeCounter.missTotal % 3 === 1) {
      this.dragPanel.glow(this.targetItem.item.recipe[0])
    }
    if (this.recipeCounter.missTotal % 3 === 2) {
      this.dragPanel.glow(this.targetItem.item.recipe[1])
    }
    this.updateCounter()
   // this.handleCorrectCombination() 
  }
  destroy() {
    if (this.targetItem) {
      this.ctx.app.stage.off('pointermove', this.onDragMove, this);
    }
    super.destroy();
  }
}

let ResultsScene;
import('./ResultsScene.js').then(m => ResultsScene = m.default);
