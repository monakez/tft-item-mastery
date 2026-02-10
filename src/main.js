import itemsData from './assets/items.json'; // Vite сам преобразует это в объект
import Context from './Context.js';
import { Application, Assets } from 'pixi.js';
import HomeScene from './scenes/HomeScene.js';
import { initDevtools } from '@pixi/devtools';
import ItemSet from './components/ItemSet.js';

let app = null;

async function init() {
  // 1. Создаём экземпляр приложения
  app = new Application();

  // 2. Инициализируем с опциями
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    background: '#0f0f1a', // или 0x0f0f1a
    resizeTo: window,
    antialias: true,
    preference: 'webgl', // явно указываем рендерер
  });

  // 3. Добавляем canvas в DOM
  document.body.appendChild(app.canvas);

  // 4. Загружаем данные предметов
  const items = itemsData;
  const BASE_ITEMS = items.filter((item) => item.kind === 1);

  const EMBLEM_ITEMS = items.filter((item) => item.kind === 2);
  const EMBLEM_ITEMS_ID = EMBLEM_ITEMS.map((item) => item.id);
  const emblemIdSet = new Set(EMBLEM_ITEMS_ID);

  const COMBINED_ITEMS = items
    .filter((item) => item.kind === 3)
    .filter((item) => !item.recipe.some((i) => emblemIdSet.has(i)));

  const COMBINED_EMBLEM_ITEMS = items
    .filter((item) => item.kind === 3)
    .filter((item) => item.recipe.some((i) => emblemIdSet.has(i)));

  // 5. Загружаем текстуры
  const uniqueIcons = [...new Set(items.map((item) => item.icon))];
  const textureUrls = uniqueIcons.map((icon) => `${import.meta.env.BASE_URL}items/${icon}`);
  await Assets.load(textureUrls);

  const baseItems = new ItemSet(BASE_ITEMS, COMBINED_ITEMS);
  const emblemItems = new ItemSet([...BASE_ITEMS, ...EMBLEM_ITEMS], COMBINED_EMBLEM_ITEMS);
  const allItems = new ItemSet(
    [...BASE_ITEMS, ...EMBLEM_ITEMS],
    [...COMBINED_EMBLEM_ITEMS, ...COMBINED_ITEMS],
  );

  const ctx = new Context(app, emblemItems);
  ctx.setBase(baseItems);
  ctx.setAll(allItems);
  ctx.setEmblem(emblemItems);
  initDevtools({ app });
  // 6. Запускаем первую сцену
  ctx.goToScene(HomeScene);
}

// Экспортируем для отладки (опционально)
window.__PIXI_APP__ = app;

// Запуск
init().catch(console.error);
