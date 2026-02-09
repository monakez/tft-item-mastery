
export default class ItemSet {

  constructor(base,combo) {

    this.base=base
    this.combo=combo
  }

  getRecipe(itemId) {
    const item =  this.combo.find(i => i.id === itemId);
    const baseIds=base.map(i=>i.id)
    const rcp= item?.recipe || [];
    if (!baseIds.includes(rcp)) {
      throw new Error("invalid recipe data")
    }
    return rcp
  }

  getRandomCombinedItem() {
    const randomIndex = Math.floor(Math.random() * this.combo.length);
    return this.combo[randomIndex];
  }
  findItemByRecipe(recipe) {
    const sortedRecipe = recipe.slice().sort();
    return this.combo.find(item => {
      if (!item.recipe) return false;
      const sortedItemRecipe = item.recipe.slice().sort();
      return JSON.stringify(sortedRecipe) === JSON.stringify(sortedItemRecipe);
    });
  }

}
