import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';

// 2 значение -тип. 1 - база 2 - для эмблем. 3 - композитный
// 🔑 Базовые предметы (только те, что используем в тренажёре)
const BASE_ITEM_NAME_TO_ID = {
  'B. F. Sword': 1,
  'Tear of the Goddess': 1,
  'Needlessly Large Rod': 1,
  'Recurve Bow': 1,
  'Chain Vest': 1,
  'Negatron Cloak': 1,
  "Giant's Belt": 1,
  'Sparring Gloves': 1,
  Spatula: 2,
  'Frying Pan': 2,
};

async function fetchCompositeRecipes() {
  console.log('🔍 Fetching composite recipes from base items...');
  const compositeRecipes = new Map();

  for (const [baseName] of Object.entries(BASE_ITEM_NAME_TO_ID)) {
    const encodedText = encodeURIComponent(`{{Tooltip/TFT|${baseName}|set=16|type=item}}`);
    const url = `https://wiki.leagueoflegends.com/en-us/api.php?action=parse&format=json&prop=text&contentmodel=wikitext&text=${encodedText}`;

    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'TFT-Parser/1.0 (contact@example.com)' },
      });

      const html = response.data.parse.text['*'];
      const $ = cheerio.load(html);

      // Извлекаем все композитные предметы и их рецепты
      $('th:contains("Upgrades")')
        .closest('table')
        .find('.centered-grid-icon')
        .each((i, el) => {
          const components = [];
          let compositeName = '';

          $(el)
            .find('.inline-image')
            .each((j, compEl) => {
              const title = $(compEl).find('a').attr('title');
              if (title) {
                const itemName = title.replace('An icon for the item ', '').trim();
                if (j === 0) {
                  // Первый элемент - базовый компонент
                  const compId = iid(itemName);
                  if (compId) {
                    components.push(compId);
                  }
                } else if (j === 1) {
                  // Второй элемент - композитный предмет
                  compositeName = itemName;
                }
              }
            });

          // Добавляем текущий базовый предмет как второй компонент
          const currentBaseId = iid(baseName);
          if (components.length === 1 && compositeName && currentBaseId) {
            // Убеждаемся, что рецепт не дублируется
            const recipe = [components[0], currentBaseId].sort();
            const key = `${recipe[0]}+${recipe[1]}`;

            // Сохраняем только если рецепт ещё не существует
            if (!compositeRecipes.has(key)) {
              compositeRecipes.set(key, {
                name: compositeName,
                recipe: recipe,
              });
            }
          }
        });

      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ Failed to fetch upgrades for ${baseName}:`, error.message);
    }
  }

  // Преобразуем Map в массив уникальных предметов
  const uniqueItems = new Map();
  for (const item of compositeRecipes.values()) {
    uniqueItems.set(item.name, item.recipe);
  }

  console.log(`✅ Found ${uniqueItems.size} unique composite items`);
  return Array.from(uniqueItems.entries());
}

async function parseCompositeItem(itemName) {
  const encodedText = encodeURIComponent(`{{Tooltip/TFT|${itemName}|set=16|type=item}}`);
  const url = `https://wiki.leagueoflegends.com/en-us/api.php?action=parse&format=json&prop=text&contentmodel=wikitext&text=${encodedText}`;

  try {
    console.log(`🔍 Parsing composite item: ${itemName}`);
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'TFT-Parser/1.0 (contact@example.com)' },
    });

    const html = response.data.parse.text['*'];
    const $ = cheerio.load(html);

    // Иконка
    const iconUrl = $('img').first().attr('src');
    let fullIconUrl = null;

    if (iconUrl) {
      // Убираем базовый путь вики
      const cleanUrl = iconUrl.replace('https://wiki.leagueoflegends.com', '');

      if (cleanUrl.includes('/thumb/')) {
        // Преобразуем thumbnail → полная картинка
        // Пример: /en-us/images/thumb/Item.png/64px-Item.png?hash
        // → /en-us/images/Item.png?hash
        const match = cleanUrl.match(/\/thumb\/([^/]+\.png)\/[^?]+(\?.*)?$/);
        if (match) {
          fullIconUrl = `/en-us/images/${match[1]}${match[2] || ''}`;
        } else {
          fullIconUrl = cleanUrl.replace('/thumb/', '/').split('/').slice(0, -1).join('/');
        }
      } else {
        // Уже полная картинка
        fullIconUrl = cleanUrl;
      }
    }

    // Извлекаем имя файла для сохранения
    const iconFileName = fullIconUrl
      ? fullIconUrl.split('/').pop().split('?')[0]
      : `${itemName.replace(/\s+/g, '_')}.png`;

    // Статы
    const stats = {};
    let foundStats = false;

    $('div[style*="display:inline-block; box-shadow"]')
      .nextAll('div')
      .each((i, div) => {
        if (foundStats) return false;

        const table = $(div).find('table').first();
        if (table.length > 0 && !table.find('th').length) {
          table.find('tr').each((j, row) => {
            const cells = $(row).find('td');
            if (cells.length === 2) {
              const statName = cells.eq(0).text().trim();
              const statValue = cells.eq(1).text().trim();
              if (statName && statValue) {
                const key = statName.toLowerCase().replace(/\s+/g, '');
                stats[key] = statValue;
              }
            }
          });
          foundStats = true;
          return false;
        }
      });

    // Описание
    let description = '';
    $('div[style*="border-top:1px solid #1B2F65; margin-bottom:10px; padding-bottom: 5px;"]')
      .find('td')
      .each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('Passive:') || text.includes('Active:') || text.includes('When')) {
          description = text;
          return false;
        }
      });

    return {
      id: iid(itemName),
      name: itemName,
      icon: iconFileName, // Только имя файла
      iconUrl: fullIconUrl, // Полный URL для скачивания
      stats: stats,
      description: description,
      kind: 3,
    };
  } catch (error) {
    console.error(`❌ Failed to parse ${itemName}:`, error.message);
    return null;
  }
}

function iid(str) {
  return str.replaceAll(' ', '_').replace(/[^a-zA-Z]/g, '');
}

async function downloadIcons(items) {
  await mkdir('public/items', { recursive: true });

  for (const item of items) {
    if (!item.iconUrl) continue;

    item.icon = item.icon.replace(/%[0-9A-Fa-f]{2}/g, '');
    const fullUrl = `https://wiki.leagueoflegends.com${item.iconUrl}`;
    const filePath = `public/items/${item.icon}`;

    try {
      console.log(`📥 Downloading icon for ${item.name}: ${filePath}`);
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        responseType: 'stream',
      });

      const writer = createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`❌ Failed to download ${item.name}: ${item.iconUrl} `, error.message);
    }

    delete item.iconUrl;
    await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limit
  }
}

async function main() {
  // Шаг 1: Получаем рецепты композитных предметов
  const compositeItems = await fetchCompositeRecipes();

  // Шаг 2: Создаём массив всех предметов
  const items = [];

  // Добавляем базовые предметы
  for (const [name, kind] of Object.entries(BASE_ITEM_NAME_TO_ID)) {
    const urilfied = name.replaceAll("'", '%27').replaceAll(' ', '_');
    items.push({
      name: name,
      id: iid(name),
      iconUrl: `/en-us/images/${urilfied}_TFT_item.png`,
      icon: `${urilfied}_TFT_item.png`,
      stats: {},
      description: '',
      kind: kind,
      recipe: null,
    });
  }

  // Парсим композитные предметы
  for (const [itemName, recipe] of compositeItems) {
    const itemData = await parseCompositeItem(itemName);
    if (itemData) {
      items.push({
        ...itemData,
        recipe: recipe,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Сохраняем результат
  console.log(`✅ Successfully parsed ${items.length} items!`);
  // В конце main()
  await downloadIcons(items.filter((item) => item.iconUrl));
  console.log(`✅ Successfully fetched icons for ${items.length} items!`);
  await writeFile('src/assets/items.json', JSON.stringify(items, null, 2));
  console.log('📄 Output saved to items.json');
}

main().catch(console.error);
