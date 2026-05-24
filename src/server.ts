import config from "./config/env";
import app from "./app";
import { initDB } from "./utility/db.init";


const main = () => {
  initDB();
  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`);
  });
}

main();