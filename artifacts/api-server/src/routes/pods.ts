import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.podSlug, slug));
    if (!project || !project.isPod) {
      return res.status(404).json({ error: "Pod not found" });
    }
    res.json(serializeProject(project));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get pod" });
  }
});

function serializeProject(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    totalBudget: p.totalBudget != null ? Number(p.totalBudget) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export default router;
