export const generateMap = (
  width,
  height,
  maxSteps,
  chestCount,
  enemyCount,
) => {
  const map = [];
  // генерация уровней
  for (let y = 0; y < height; y++) {
    const row = new Array(width).fill(0);
    map.push(row);
  }

  // Размещаем "шахтёра" (алгоритм, который будет делать генерацию) в центр карты
  let minerX = Math.floor(width / 2);
  let minerY = Math.floor(height / 2);

  // 1 точка всегда пол
  map[minerY][minerX] = 1;

  // Цикл для следующего метса появления
  for (let x = 0; x <= maxSteps; x++) {
    const minerWay = Math.floor(Math.random() * 4);

    let nextX = minerX;
    let nextY = minerY;

    switch (minerWay) {
      case 0:
        nextY -= 1;
        break;
      case 1:
        nextY += 1;
        break;
      case 2:
        nextX -= 1;
        break;
      case 3:
        nextX += 1;
        break;
    }

    // Проверка чтобы алгоритм не выходил за карту
    if (nextX > 0 && nextX < width - 1 && nextY > 0 && nextY < height - 1) {
      minerX = nextX;
      minerY = nextY;

      map[minerY][minerX] = 1;
    }
  }

  // Для спавна ивентов (бой, сундуки, тд)
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  // count - СКОЛЬКО штук ставить
  // entityId - ЧТО ИМЕННО ставить (код 2 или 3)
  const spawnEntities = (count, entityId) => {
    let spawned = 0; // Внутренний счетчик, никому снаружи не нужен

    while (spawned < count) {
      const randX = Math.floor(Math.random() * width);
      const randY = Math.floor(Math.random() * height);

      if (map[randY][randX] === 1 && !(randX === startX && randY === startY)) {
        map[randY][randX] = entityId; // Ставим правильный код объекта!
        spawned++;
      }
    }
  };

  spawnEntities(chestCount, 2); // 2 штуки, код объекта 2 (Сундук)
  spawnEntities(enemyCount, 3); // 5 штук, код объекта 3 (Враг)

  return map;
};
