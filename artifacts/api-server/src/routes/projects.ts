import { Router } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  charactersTable,
  beatsTable,
  scenesTable,
  castMembersTable,
  crewMembersTable,
  shotsTable,
  budgetItemsTable,
  lightingDiagramsTable,
  productionPacketsTable,
  postMilestonesTable,
  deliverablesTable,
  distributionEntriesTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  DeleteProjectParams,
  UpdateProjectParams,
  GetProjectDashboardParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.createdAt));
    res.json(projects.map(serializeProject));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateProjectBody.parse(req.body);
    const [project] = await db
      .insert(projectsTable)
      .values({
        ...body,
        totalBudget: body.totalBudget != null ? String(body.totalBudget) : null,
      })
      .returning();
    res.status(201).json(serializeProject(project));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid project data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetProjectParams.parse({ id: Number(req.params.id) });
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id));
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(serializeProject(project));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get project" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateProjectParams.parse({ id: Number(req.params.id) });
    const body = UpdateProjectBody.parse(req.body);
    const [updated] = await db
      .update(projectsTable)
      .set({
        ...body,
        totalBudget: body.totalBudget != null ? String(body.totalBudget) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projectsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(serializeProject(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteProjectParams.parse({ id: Number(req.params.id) });
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

router.get("/:id/dashboard", async (req, res) => {
  try {
    const { id } = GetProjectDashboardParams.parse({ id: Number(req.params.id) });
    const [
      characters,
      cast,
      crew,
      shots,
      budgetItems,
      scenes,
      beats,
      lightingDiagrams,
      packets,
      postMilestones,
      deliverables,
      distributionEntries,
    ] = await Promise.all([
      db.select().from(charactersTable).where(eq(charactersTable.projectId, id)),
      db.select().from(castMembersTable).where(eq(castMembersTable.projectId, id)),
      db.select().from(crewMembersTable).where(eq(crewMembersTable.projectId, id)),
      db.select().from(shotsTable).where(eq(shotsTable.projectId, id)),
      db.select().from(budgetItemsTable).where(eq(budgetItemsTable.projectId, id)),
      db.select().from(scenesTable).where(eq(scenesTable.projectId, id)),
      db.select().from(beatsTable).where(eq(beatsTable.projectId, id)),
      db.select().from(lightingDiagramsTable).where(eq(lightingDiagramsTable.projectId, id)),
      db.select().from(productionPacketsTable).where(eq(productionPacketsTable.projectId, id)),
      db.select().from(postMilestonesTable).where(eq(postMilestonesTable.projectId, id)),
      db.select().from(deliverablesTable).where(eq(deliverablesTable.projectId, id)),
      db.select().from(distributionEntriesTable).where(eq(distributionEntriesTable.projectId, id)),
    ]);

    const budgetTotal = budgetItems.reduce((sum, item) => sum + (item.estimatedAmount ?? 0), 0);
    const budgetAllocated = budgetItems.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0);

    const recentActivity = [
      ...scenes.slice(-2).map((s) => ({
        type: "scene",
        description: `Scene ${s.sceneNumber}: ${s.heading}`,
        timestamp: s.createdAt.toISOString(),
      })),
      ...characters.slice(-2).map((c) => ({
        type: "character",
        description: `Character added: ${c.name}`,
        timestamp: c.createdAt.toISOString(),
      })),
      ...shots.slice(-2).map((s) => ({
        type: "shot",
        description: `Shot ${s.shotNumber} — ${s.shotType ?? ""}`,
        timestamp: s.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    res.json({
      projectId: id,
      sceneCount: scenes.length,
      characterCount: characters.length,
      castCount: cast.length,
      crewCount: crew.length,
      shotCount: shots.length,
      budgetTotal,
      budgetAllocated,
      beatCount: beats.length,
      lightingDiagramCount: lightingDiagrams.length,
      packetCount: packets.length,
      postMilestoneCount: postMilestones.length,
      postMilestoneCompleteCount: postMilestones.filter(m => m.status === "complete").length,
      deliverableCount: deliverables.length,
      distributionCount: distributionEntries.length,
      distributionAcceptedCount: distributionEntries.filter(e => ["accepted","deal-made"].includes(e.status ?? "")).length,
      recentActivity,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get dashboard" });
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
