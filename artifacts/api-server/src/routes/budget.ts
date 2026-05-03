import { Router } from "express";
import { db } from "@workspace/db";
import { budgetItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListBudgetItemsParams,
  CreateBudgetItemParams,
  CreateBudgetItemBody,
  UpdateBudgetItemParams,
  UpdateBudgetItemBody,
  DeleteBudgetItemParams,
  GetBudgetSummaryParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/summary", async (req, res) => {
  try {
    const { projectId } = GetBudgetSummaryParams.parse({ projectId: Number(req.params.projectId) });
    const items = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.projectId, projectId));

    const totalEstimated = items.reduce((s, i) => s + (i.estimatedAmount ?? 0), 0);
    const totalActual = items.reduce((s, i) => s + (i.actualAmount ?? 0), 0);

    const categoryMap: Record<string, { estimated: number; actual: number }> = {};
    for (const item of items) {
      if (!categoryMap[item.category]) categoryMap[item.category] = { estimated: 0, actual: 0 };
      categoryMap[item.category].estimated += item.estimatedAmount ?? 0;
      categoryMap[item.category].actual += item.actualAmount ?? 0;
    }

    const byCategory = Object.entries(categoryMap).map(([category, totals]) => ({ category, ...totals }));
    const percentSpent = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;

    res.json({ totalEstimated, totalActual, byCategory, percentSpent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get budget summary" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListBudgetItemsParams.parse({ projectId: Number(req.params.projectId) });
    const items = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.projectId, projectId));
    res.json(items.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list budget items" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateBudgetItemParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateBudgetItemBody.parse(req.body);
    const [item] = await db.insert(budgetItemsTable).values({ ...body, projectId }).returning();
    res.status(201).json(serialize(item));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid budget item data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateBudgetItemParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateBudgetItemBody.parse(req.body);
    const [updated] = await db
      .update(budgetItemsTable)
      .set(body)
      .where(and(eq(budgetItemsTable.id, id), eq(budgetItemsTable.projectId, projectId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(serialize(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { projectId, id } = DeleteBudgetItemParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(budgetItemsTable).where(and(eq(budgetItemsTable.id, id), eq(budgetItemsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(i: typeof budgetItemsTable.$inferSelect) {
  return { ...i, createdAt: i.createdAt.toISOString() };
}

export default router;
