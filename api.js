import { Enemy } from "./Enemy.js";

export const fetchEnemies = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const serverData = [
        new Enemy(
          "Goblin",
          50,
          5,
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Goblin_by_armandeo64.jpg/640px-Goblin_by_armandeo64.jpg",
        ),
        new Enemy(
          "Orc",
          100,
          10,
          "https://i.pinimg.com/736x/1b/bd/48/1bbd4854fef85e7decdefa4b2ecfd9db.jpg",
        ),
        new Enemy(
          "Dragon",
          500,
          100,
          "https://i.pinimg.com/736x/98/78/37/987837c4eab3444e144e22ddf6ab0969.jpg",
        ),
      ];

      console.log("Server: Data sent.");
      resolve(serverData);

      // reject("Server Error 500: Database connection failed.");
    }, 1500);
  });
};
