import { Router } from "express";
import { db } from "@workspace/db";
import { distributionStrategyTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const [row] = await db
      .select()
      .from(distributionStrategyTable)
      .where(eq(distributionStrategyTable.projectId, projectId));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(serialize(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get distribution strategy" });
  }
});

router.put("/", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const existing = await db
      .select()
      .from(distributionStrategyTable)
      .where(eq(distributionStrategyTable.projectId, projectId));

    let row;
    if (existing.length > 0) {
      [row] = await db
        .update(distributionStrategyTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(distributionStrategyTable.projectId, projectId))
        .returning();
    } else {
      [row] = await db
        .insert(distributionStrategyTable)
        .values({ ...req.body, projectId })
        .returning();
    }
    res.json(serialize(row));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

function serialize(r: typeof distributionStrategyTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

export default router;
