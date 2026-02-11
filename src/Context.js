import { ItemSetType } from './components/ItemSetType';

export default class Context {
  constructor(app) {
    this.app = app;
    this.currentScene = null;
    this.sets = {};
    this.activeSetId = ItemSetType.BASE.id;
  }
  initializeSets(baseData, emblemData, allData) {
    this.sets[ItemSetType.BASE.id] = baseData;
    this.sets[ItemSetType.EMBLEM.id] = emblemData;
    this.sets[ItemSetType.ALL.id] = allData;
  }

  // Геттер возвращает данные, соответствующие активному типу
  get currentSet() {
    return this.sets[this.activeSetId];
  }

  // Смена активного сета по ID
  selectSet(id) {
    if (this.sets[id]) {
      this.activeSetId = id;
    }
  }

  goToScene(SceneClass, ...args) {
    if (this.currentScene) {
      this.currentScene.destroy();
    }
    this.currentScene = new SceneClass(this, ...args);
    this.app.stage.addChild(this.currentScene.container);
  }
}
