import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config";

const app = createApp();

app.listen(Number(env.PORT), () => {
  console.log(`Promptly API running on http://localhost:${env.PORT}`);
});
