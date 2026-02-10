export default class Context {
  constructor(app, currentSet) {
    this.app = app;
    this.currentScene = null;
    this.sets = {};
    this.currentSet = currentSet;
  }
  setEmblem(base) {
    this.sets['emblem'] = base;
  }
  setAll(base) {
    this.sets['all'] = base;
  }
  setBase(base) {
    this.sets['base'] = base;
  }

  goToScene(SceneClass, ...args) {
    if (this.currentScene) {
      this.currentScene.destroy();
    }
    this.currentScene = new SceneClass(this, ...args);
    this.app.stage.addChild(this.currentScene.container);
  }
}
