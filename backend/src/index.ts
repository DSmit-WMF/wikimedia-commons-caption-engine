import express from "express";
import cors from "cors";
import routes from "./api/routes.js";
import { config } from "./config.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);

app.listen(config.port, () => {
  console.log(`Caption engine backend listening on http://localhost:${config.port}`);
});
