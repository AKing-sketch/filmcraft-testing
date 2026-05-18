import { Router } from "express";
import { db } from "@workspace/db";
import { workspaceSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateWorkspaceSettingsBody } from "@workspace/api-zod";

const router = Router();
const WORKSPACE_ID = 1;

async function getOrCreate() {
  const [existing] = await db
    .select()
    .from(workspaceSettingsTable)
    .where(eq(workspaceSettingsTable.id, WORKSPACE_ID))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(workspaceSettingsTable)
    .values({ name: "My Studio" })
    .returning();
  return created;
}

router.get("/", async (req, res) => {
  try {
    const workspace = await getOrCreate();
    res.json(serialize(workspace));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get workspace settings" });
  }
});

router.put("/", async (req, res) => {
  try {
    const body = UpdateWorkspaceSettingsBody.parse(req.body);
    await getOrCreate();
    const [updated] = await db
      .update(workspaceSettingsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(workspaceSettingsTable.id, WORKSPACE_ID))
      .returning();
    res.json(serialize(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid workspace data" });
  }
});

function serialize(w: typeof workspaceSettingsTable.$inferSelect) {
  return {
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export default router;
