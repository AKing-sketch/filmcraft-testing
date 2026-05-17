import { Router } from "express";
import { db } from "@workspace/db";
import { productionToolsTable, insertProductionToolSchema } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router({ mergeParams: true });

const ToolBody = insertProductionToolSchema.omit({ projectId: true });

router.get("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const tools = await db
      .select()
      .from(productionToolsTable)
      .where(eq(productionToolsTable.projectId, projectId))
      .orderBy(productionToolsTable.category, productionToolsTable.name);
    res.json(tools);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list tools" });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const data = ToolBody.parse(req.body);
    const [tool] = await db
      .insert(productionToolsTable)
      .values({ projectId, ...data })
      .returning();
    res.status(201).json(tool);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Failed to create tool" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const id = parseInt(req.params.id, 10);
    const data = ToolBody.parse(req.body);
    const [tool] = await db
      .update(productionToolsTable)
      .set(data)
      .where(and(eq(productionToolsTable.id, id), eq(productionToolsTable.projectId, projectId)))
      .returning();
    if (!tool) return res.status(404).json({ error: "Tool not found" });
    res.json(tool);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Failed to update tool" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const id = parseInt(req.params.id, 10);
    await db
      .delete(productionToolsTable)
      .where(and(eq(productionToolsTable.id, id), eq(productionToolsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete tool" });
  }
});

export default router;
