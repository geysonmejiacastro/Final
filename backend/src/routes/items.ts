import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

const ItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["active", "retired", "repair"]).default("active"),
  notes: z.string().optional().nullable(),
});

// GET all
router.get("/", async (_req, res) => {
  const result = await pool.query("SELECT * FROM items ORDER BY created_at DESC");
  res.json(result.rows);
});

// POST create
router.post("/", async (req, res) => {
  const parsed = ItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
  }

  const { name, category, status, notes } = parsed.data;

  const result = await pool.query(
    `INSERT INTO items (name, category, status, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, category, status, notes ?? null]
  );

  res.status(201).json(result.rows[0]);
});

// PUT update
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const parsed = ItemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
  }

  const current = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
  if (current.rowCount === 0) return res.status(404).json({ message: "Not found" });

  const merged = { ...current.rows[0], ...parsed.data };

  const result = await pool.query(
    `UPDATE items
     SET name=$1, category=$2, status=$3, notes=$4
     WHERE id=$5
     RETURNING *`,
    [merged.name, merged.category, merged.status, merged.notes, id]
  );

  res.json(result.rows[0]);
});

// DELETE
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await pool.query("DELETE FROM items WHERE id=$1 RETURNING *", [id]);
  if (result.rowCount === 0) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted", item: result.rows[0] });
});

export default router;
