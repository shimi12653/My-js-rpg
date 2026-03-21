export const generateMap = (
  width,
  height,
  wallChance,
  chestCount,
  enemyCount,
) => {
  let map = [];

  // Первая генерация карты (случайная)
  for (let y = 0; y < height; y++) {
    // сперва создаём строчку (у)
    const row = [];
    for (let x = 0; x < width; x++) {
      // потом создаём столбик (х)
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(0); // если это край карты - это 0
      } else {
        row.push(Math.random() < wallChance ? 0 : 1); // в другом случае - идёт рандом
      }
    }
    map.push(row); // новую строчку кладём в карту
  }

  // счётчик стен вокруг точки
  const countAliveNeighbours = (mapX, mapY) => {
    // Счётчик, который делает вокруг нас стены
    let count = 0; // счётчик, который считает стены вокруг своей точки
    for (let i = -1; i <= 1; i++) {
      // шаг по оси х
      for (let j = -1; j <= 1; j++) {
        // шаг по оси у
        if (i === 0 && j === 0) continue; // стоковая точка не считается

        let nearX = mapX + i; // координаты воркуг (по оси х)
        let nearY = mapY + j; // по оси у

        if (nearX < 0 || nearY < 0 || nearX >= width || nearY >= height) {
          count++; // края карты считаются за стены. Потому счётчик +
        } else if (map[nearY][nearX] === 0) {
          count++; // если есть рядом 0 - счётчик +
        }
      }
    }
    return count;
  };

  // Чистка генерации
  const simulationSteps = 5; // какое кол-во чисток у нас будет (эволюций)

  for (let step = 0; step < simulationSteps; step++) {
    const newMap = [];
    for (let y = 0; y < height; y++) {
      const newRow = [];
      for (let x = 0; x < width; x++) {
        const nears = countAliveNeighbours(x, y);

        if (map[y][x] === 0) {
          newRow.push(nears >= 4 ? 0 : 1); // условие для стены: если рядом минимум 4 стены - стена остаётся. Если нет - это пол
        } else {
          newRow.push(nears >= 5 ? 0 : 1); // условие для пола: если рядом минимум 5 стен - он становится камнем. Если нет - остаётся полом
        }
      }
      newMap.push(newRow); // возвращаем в новую карту строчки
    }
    map = newMap; // новая карта становится нашей текущей
  }

  // Спавн колонн, одиночных стен (для интереса и разнообразия)
  const pillarCount = 10; // сколько мы хотим стен сделать

  for (let i = 0; i < pillarCount; i++) {
    const randX = Math.floor(Math.random() * (width - 2)); // рандомная позиция на карте (касаясь краёв карты)
    const randY = Math.floor(Math.random() * (height - 2));

    if (map[randY][randX] === 1) {
      map[randY][randX] = 0;
    }
  }

  // Чистим точки для нашего спавна
  const startY = Math.floor(height / 2); // точки спавна
  const startX = Math.floor(width / 2);

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      map[startX + i][startY + j] = 1; // квадрат 3х3 вокруг точек спавна = 1
    }
  }

  // Раскидка монстров и лута
  const spawnEntities = (count, entityId) => {
    let spawned = 0; // Счётчик врагов (сколько заспавнилось)
    let attempts = 0; // защита от зависания сервера

    while (spawned < count && attempts < 1000) {
      // Пока появившихся врагов < нашей переменной и переменной < 1000 делать цикл
      const randX = Math.floor(Math.random() * width); // рандомный х
      const randY = Math.floor(Math.random() * height); // рандомный н

      if (
        map[randY][randX] === 1 &&
        !(Math.abs(randX - startX) <= 1 && Math.abs(randY - startY) <= 1)
      ) {
        // если позиция карты 1 и не стоит ли далеко сундук или враг (Math.abs() - модуль числа, т.е. положительное значение)
        map[randY][randX] = entityId; // даём сюда наше собитие (враг или сундук)
        spawned++;
      }
      attempts++;
    }
  };

  spawnEntities(chestCount, 2);
  spawnEntities(enemyCount, 3);

  return map;
};
