import { Router } from "express";
import { db } from "@workspace/db";
import {
  productionPacketsTable,
  scenesTable,
  castMembersTable,
  crewMembersTable,
  shotsTable,
  budgetItemsTable,
  projectsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListProductionPacketsParams,
  CreateProductionPacketParams,
  CreateProductionPacketBody,
  GetProductionPacketParams,
  DeleteProductionPacketParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListProductionPacketsParams.parse({ projectId: Number(req.params.projectId) });
    const packets = await db.select().from(productionPacketsTable).where(eq(productionPacketsTable.projectId, projectId));
    res.json(packets.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list packets" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateProductionPacketParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateProductionPacketBody.parse(req.body);

    let content = body.content ?? null;

    if (!content) {
      content = await generatePacketContent(projectId, body.packetType);
    }

    const [packet] = await db
      .insert(productionPacketsTable)
      .values({ ...body, projectId, content })
      .returning();
    res.status(201).json(serialize(packet));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid packet data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { projectId, id } = GetProductionPacketParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const [packet] = await db
      .select()
      .from(productionPacketsTable)
      .where(and(eq(productionPacketsTable.id, id), eq(productionPacketsTable.projectId, projectId)));
    if (!packet) return res.status(404).json({ error: "Not found" });
    res.json(serialize(packet));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get packet" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { projectId, id } = DeleteProductionPacketParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(productionPacketsTable).where(and(eq(productionPacketsTable.id, id), eq(productionPacketsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

async function generatePacketContent(projectId: number, packetType: string): Promise<string> {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  const scenes = await db.select().from(scenesTable).where(eq(scenesTable.projectId, projectId));
  const cast = await db.select().from(castMembersTable).where(eq(castMembersTable.projectId, projectId));
  const crew = await db.select().from(crewMembersTable).where(eq(crewMembersTable.projectId, projectId));
  const shots = await db.select().from(shotsTable).where(eq(shotsTable.projectId, projectId));
  const budget = await db.select().from(budgetItemsTable).where(eq(budgetItemsTable.projectId, projectId));

  const title = project?.title ?? "Untitled";

  if (packetType === "scene-breakdown" || packetType === "script-breakdown") {
    return JSON.stringify({ title, scenes });
  }
  if (packetType === "cast-list") {
    return JSON.stringify({ title, cast });
  }
  if (packetType === "crew-list") {
    return JSON.stringify({ title, crew });
  }
  if (packetType === "shot-list") {
    return JSON.stringify({ title, shots });
  }
  if (packetType === "budget") {
    return JSON.stringify({ title, budget });
  }
  return JSON.stringify({ title, scenes, cast, crew, shots, budget });
}

function serialize(p: typeof productionPacketsTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString() };
}

export default router;
