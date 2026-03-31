const TILE_WALL = 0;
const TILE_FLOOR = 1;
const TILE_CHEST = 2;
const TILE_ENEMY = 3;
const TILE_STAIRS_DOWN = 4;
const TILE_SHOP_NPC = 5;

// Просто кидает кубик от а параметра до б параметра
const randInt = (min, maxInclusive) =>
  Math.floor(Math.random() * (maxInclusive - min + 1)) + min;

// Не даёт числу выходить за рамки (число - v, минимум дозвленный - min, макс дозволенный - max)
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Смотрит за тем, чтобы комнаты были на нормальной дистанции и не наезжали друг на друга (не стояли близко, без маржин)
const rectsOverlapWithMargin = (a, b, margin) => {
  return !(
    a.x + a.w + margin <= b.x - margin ||
    a.x - margin >= b.x + b.w + margin ||
    a.y + a.h + margin <= b.y - margin ||
    a.y - margin >= b.y + b.h + margin
  );
};

// Превращает все 0 в 1
const carveRoom = (map, room) => {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      map[y][x] = TILE_FLOOR;
    }
  }
};

// Делает коридоры между комнатами
const carveCorridor = (map, from, to) => {
  const x1 = from.x;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;

  // 1-cell wide L-corridor
  const horizFirst = Math.random() < 0.5;

  if (horizFirst) {
    const dir = x2 >= x1 ? 1 : -1;
    for (let x = x1; x !== x2 + dir; x += dir) map[y1][x] = TILE_FLOOR;
    const dirY = y2 >= y1 ? 1 : -1;
    for (let y = y1; y !== y2 + dirY; y += dirY) map[y][x2] = TILE_FLOOR;
  } else {
    const dirY = y2 >= y1 ? 1 : -1;
    for (let y = y1; y !== y2 + dirY; y += dirY) map[y][x1] = TILE_FLOOR;
    const dir = x2 >= x1 ? 1 : -1;
    for (let x = x1; x !== x2 + dir; x += dir) map[y2][x] = TILE_FLOOR;
  }
};

// Самая дальняя клетка - выход из подземелья (задача функции)
const computeBfsDistances = (map, start) => {
  const height = map.length;
  const width = map[0].length;

  const dist = Array(height)
    .fill(0)
    .map(() => Array(width).fill(-1));

  const q = [];
  dist[start.y][start.x] = 0;
  q.push(start);

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (q.length) {
    const cur = q.shift();
    for (const d of dirs) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (dist[ny][nx] !== -1) continue;

      // Traversable: any non-wall
      if (map[ny][nx] === TILE_WALL) continue;

      dist[ny][nx] = dist[cur.y][cur.x] + 1;
      q.push({ x: nx, y: ny });
    }
  }

  return dist;
};

// Размешает комнату по центру
const getRoomCenter = (room) => ({
  x: Math.floor(room.x + room.w / 2),
  y: Math.floor(room.y + room.h / 2),
});

// Проверяет 8 клеток вокруг х,у на наличие tile
const hasNeighbor = (map, cx, cy, tileType) => {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dy === 0 && dx === 0) continue; // не чекаем самого себя

      const checkY = cy + dy;
      const checkX = cx + dx;

      if (
        checkY >= 0 &&
        checkY < map.length &&
        checkX >= 0 &&
        checkX < map[0].length
      ) {
        if (map[checkY][checkX] === tileType) {
          return true; // Есть рядом зарезерв клетка
        }
      }
    }
  }
  return false; // Вокруг чисто
};

const pickRandomUnreservedTile = ({ map, candidates, reserved }) => {
  const available = candidates.filter((p) => !reserved.has(`${p.x},${p.y}`));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

export const generateMap = (
  width,
  height,
  wallChance, // unused now, but kept for backward compatibility with server calls
  chestCount,
  enemyCount,
  floor = 1,
) => {
  // Берёт массив, заполняет нуллями
  const map = Array(height)
    .fill(0)
    .map(() => Array(width).fill(TILE_WALL));

  // Special floors
  // Ставим флаги на 4 и 5 этажи
  const isBossFloor = floor === 5;
  const isSafeFloor = floor === 4;

  const rooms = [];
  const margin = 1;

  const canPlaceRooms = !isBossFloor;
  const targetRooms = isBossFloor
    ? 1
    : Math.max(4, Math.min(8, Math.floor((width + height) / 6)));

  const maxRoomTries = 250;
  let tries = 0;

  // Генерирует случайные 8 штук комнат. 250 раз выдумывает коридоры и размер комнат
  while (rooms.length < targetRooms && tries < maxRoomTries) {
    tries++;

    const roomW = randInt(3, isSafeFloor ? 6 : 7);
    const roomH = randInt(3, isSafeFloor ? 6 : 7);

    const x = randInt(1, width - roomW - 2);
    const y = randInt(1, height - roomH - 2);

    const newRoom = { x, y, w: roomW, h: roomH };

    // Prevent too close overlaps to keep rooms readable
    // Проверяет у функции rectsOverlapWithMargin всё ли окей и можно ли продолжать
    if (rooms.some((r) => rectsOverlapWithMargin(r, newRoom, margin))) continue;

    rooms.push(newRoom);
  }

  // Fallback if room placement failed (small maps / unlucky RNG)
  if (rooms.length === 0) {
    rooms.push({
      x: 2,
      y: 2,
      w: clamp(width - 4, 3, width - 4),
      h: clamp(height - 4, 3, height - 4),
    });
  }

  // 5 этаж. Одна огромная комната
  if (isBossFloor) {
    rooms.length = 0;
    const roomW = clamp(width - 6, 7, width - 2);
    const roomH = clamp(height - 6, 7, height - 2);

    rooms.push({
      x: Math.floor((width - roomW) / 2),
      y: Math.floor((height - roomH) / 2),
      w: roomW,
      h: roomH,
    });
  }

  // Делает Г-образные коридоры между комнатами (и в принципе комнаты)
  for (const room of rooms) carveRoom(map, room);

  // соединяет все комнаты
  if (rooms.length > 1) {
    const centers = rooms.map(getRoomCenter);
    for (let i = 1; i < centers.length; i++) {
      // Connect each room to a previous random room => guaranteed connectivity
      const parentIndex = randInt(0, i - 1);
      carveCorridor(map, centers[i], centers[parentIndex]);
    }
  }

  // Спавн героя первая сгенерированная комната
  let heroSpawn = getRoomCenter(rooms[0]);
  if (isBossFloor) {
    // Entrance: left side mid of the big room
    const entranceY = rooms[0].y + Math.floor(rooms[0].h / 2);
    heroSpawn = { x: rooms[0].x + 1, y: entranceY };
  }

  // Считаем где же будет спавн лестницы
  const dist = computeBfsDistances(map, heroSpawn);

  // Choose STAIRS_DOWN
  let stairsPos = null;
  if (isBossFloor) {
    // In a single-room boss fight we place stairs far away from hero and not on the boss
    const bossPos = {
      x: rooms[0].x + Math.floor(rooms[0].w / 2),
      y: rooms[0].y + Math.floor(rooms[0].h / 2),
    };

    let best = null;
    let bestD = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] !== TILE_FLOOR) continue;
        if (x === bossPos.x && y === bossPos.y) continue;
        if (x === heroSpawn.x && y === heroSpawn.y) continue;

        const d = dist[y][x];
        if (d > bestD) {
          bestD = d;
          best = { x, y };
        }
      }
    }

    stairsPos = best || getRoomCenter(rooms[0]);
  } else {
    // Furthest room by distance to its center
    let bestRoom = null;
    let bestD = -1;
    for (const room of rooms) {
      const c = getRoomCenter(room);
      const d = dist[c.y]?.[c.x] ?? -1;
      if (d > bestD) {
        bestD = d;
        bestRoom = room;
      }
    }
    stairsPos = bestRoom ? getRoomCenter(bestRoom) : heroSpawn;
  }

  // Резервируем элементы, которые мы не хотим перезаписывать позже
  const reserved = new Set();
  const startRoom = rooms[0];
  for (let y = startRoom.y; y < startRoom.y + startRoom.h; y++) {
    for (let x = startRoom.x; x < startRoom.x + startRoom.w; x++) {
      reserved.add(`${x},${y}`);
    }
  }
  reserved.add(`${stairsPos.x},${stairsPos.y}`);

  // Place stairs on the map
  map[stairsPos.y][stairsPos.x] = TILE_STAIRS_DOWN;

  // Floor4: shop npc
  let shopPos = null;
  if (isSafeFloor) {
    const candidates = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (map[y][x] === TILE_FLOOR) candidates.push({ x, y });
      }
    }
    // Берём все клетки, выкидываем оттуда все reserved, вставляем в рандом клетку сундук или врага. Потом добавляет в reserved её
    shopPos = pickRandomUnreservedTile({
      map,
      candidates,
      reserved,
    });

    if (shopPos) {
      reserved.add(`${shopPos.x},${shopPos.y}`);
      map[shopPos.y][shopPos.x] = TILE_SHOP_NPC;
    }
  }

  // Chests
  let finalChestCount = 0;
  if (!isBossFloor) {
    if (isSafeFloor) finalChestCount = Math.min(chestCount, 4);
    else finalChestCount = chestCount;
  }

  const chestCandidates = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] !== TILE_FLOOR) continue;
      chestCandidates.push({ x, y });
    }
  }

  const chests = [];
  for (let i = 0; i < finalChestCount; i++) {
    let pick = null;
    let attempts = 0;

    while (attempts < 50) {
      // Пытаемся найти одинокое место (максимум 50 попыток)
      pick = pickRandomUnreservedTile({
        map,
        candidates: chestCandidates,
        reserved,
      });

      if (!pick) break;

      // Если в радиусе 1 клетки НЕТ другого сундука - место найдено!
      if (!hasNeighbor(map, pick.x, pick.y, TILE_CHEST)) {
        break;
      }

      // Если сосед есть - забракуем точку и попробуем снова
      pick = null;
      attempts++;
    }

    // Если за 50 попыток так и не нашли пустого места - пропускаем сундук
    if (!pick) continue;

    reserved.add(`${pick.x},${pick.y}`);
    chests.push(pick); // Заменили chestPositions на chests
    map[pick.y][pick.x] = TILE_CHEST;
  }

  // Enemies
  let bossPos = null;
  let keyHolderPos = null;

  if (isBossFloor) {
    bossPos = {
      x: rooms[0].x + Math.floor(rooms[0].w / 2),
      y: rooms[0].y + Math.floor(rooms[0].h / 2),
    };

    // Ensure we don't overwrite hero spawn
    if (bossPos.x === heroSpawn.x && bossPos.y === heroSpawn.y) {
      bossPos = { x: heroSpawn.x + 1, y: heroSpawn.y };
    }

    reserved.add(`${bossPos.x},${bossPos.y}`);
    map[bossPos.y][bossPos.x] = TILE_ENEMY;

    // Boss carries the key
    keyHolderPos = { ...bossPos };
  } else {
    const effectiveEnemyCount = isSafeFloor ? 0 : Math.max(1, enemyCount);

    const enemyCandidates = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (map[y][x] !== TILE_FLOOR) continue;
        enemyCandidates.push({ x, y });
      }
    }

    const enemyPositions = [];
    for (let i = 0; i < effectiveEnemyCount; i++) {
      let pick = null;
      let attempts = 0;

      // Пытаемся найти одинокое место (максимум 50 попыток)
      while (attempts < 50) {
        // Убрали слово const
        pick = pickRandomUnreservedTile({
          map,
          candidates: enemyCandidates,
          reserved,
        });

        if (!pick) break;

        // Если в радиусе 1 клетки НЕТ другого врага - место найдено!
        if (!hasNeighbor(map, pick.x, pick.y, TILE_ENEMY)) {
          break;
        }

        // Если сосед есть - забракуем точку и попробуем снова
        pick = null;
        attempts++;
      }

      // Если за 50 попыток так и не нашли пустого места - пропускаем этого моба
      if (!pick) continue;

      reserved.add(`${pick.x},${pick.y}`);
      enemyPositions.push(pick);
      map[pick.y][pick.x] = TILE_ENEMY;
    }

    if (!isSafeFloor && enemyPositions.length > 0) {
      keyHolderPos = enemyPositions[randInt(0, enemyPositions.length - 1)];
    }
  }

  return {
    map,
    heroSpawn,
    stairsPos,
    shopPos,
    chests: chests,
    bossPos,
    keyHolderPos,
  };
};
