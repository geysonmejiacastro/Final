import "dotenv/config";
import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Backend is healthy" });
});

app.use("/api/items", itemsRouter);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
