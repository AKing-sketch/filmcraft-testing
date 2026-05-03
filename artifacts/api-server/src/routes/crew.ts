import { Router } from "express";
import { db } from "@workspace/db";
import { crewMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCrewMembersParams,
  CreateCrewMemberParams,
  CreateCrewMemberBody,
  UpdateCrewMemberParams,
  UpdateCrewMemberBody,
  DeleteCrewMemberParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListCrewMembersParams.parse({ projectId: Number(req.params.projectId) });
    const members = await db.select().from(crewMembersTable).where(eq(crewMembersTable.projectId, projectId));
    res.json(members.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list crew" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateCrewMemberParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateCrewMemberBody.parse(req.body);
    const [member] = await db.insert(crewMembersTable).values({ ...body, projectId }).returning();
    res.status(201).json(serialize(member));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid crew data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateCrewMemberParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateCrewMemberBody.parse(req.body);
    const [updated] = await db
      .update(crewMembersTable)
      .set(body)
      .where(and(eq(crewMembersTable.id, id), eq(crewMembersTable.projectId, projectId)))
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
    const { projectId, id } = DeleteCrewMemberParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(crewMembersTable).where(and(eq(crewMembersTable.id, id), eq(crewMembersTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(m: typeof crewMembersTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

export default router;
