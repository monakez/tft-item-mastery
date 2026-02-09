import itemsData from '../assets/items.json';

const ITEMS = itemsData;
const BASE_ITEMS = itemsData.filter(item => item.kind === 1);

const EMBLEM_ITEMS = itemsData.filter(item => item.kind === 2);
const EMBLEM_ITEMS_ID = EMBLEM_ITEMS.map(item=>item.id);

const COMBINED_ITEMS = itemsData.filter(item => item.kind===3).filter(item=>!item.recipe.includes(EMBLEM_ITEMS_ID));
const COMBINED_EMBLEM_ITEMS = itemsData.filter(item => item.kind===3).filter(item=>item.recipe.includes(EMBLEM_ITEMS_ID));

export { ITEMS, BASE_ITEMS, EMBLEM_ITEMS, COMBINED_ITEMS,COMBINED_EMBLEM_ITEMS };

export function getRecipe(itemId) {
  const item = ITEMS.find(i => i.id === itemId);
  return item?.recipe || [];
}

export function getRandomCombinedItem() {
  const randomIndex = Math.floor(Math.random() * COMBINED_ITEMS.length);
  return COMBINED_ITEMS[randomIndex];
}

// найти предмет по рецепту
export function findItemByRecipe(items, recipe) {
  const sortedRecipe = recipe.slice().sort();
  return items.find(item => {
    if (!item.recipe) return false;
    const sortedItemRecipe = item.recipe.slice().sort();
    return JSON.stringify(sortedRecipe) === JSON.stringify(sortedItemRecipe);
  });
}
