import { Router } from "express";
import { db } from "@workspace/db";
import { castingCallsTable, castMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCastingCallsParams,
  CreateCastingCallParams,
  CreateCastingCallBody,
  UpdateCastingCallParams,
  UpdateCastingCallBody,
  DeleteCastingCallParams,
  ListCastMembersParams,
  CreateCastMemberParams,
  CreateCastMemberBody,
  UpdateCastMemberParams,
  UpdateCastMemberBody,
  DeleteCastMemberParams,
} from "@workspace/api-zod";

export const castingCallsRouter = Router({ mergeParams: true });

castingCallsRouter.get("/", async (req, res) => {
  try {
    const { projectId } = ListCastingCallsParams.parse({ projectId: Number(req.params.projectId) });
    const calls = await db.select().from(castingCallsTable).where(eq(castingCallsTable.projectId, projectId));
    res.json(calls.map(serializeCall));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list casting calls" });
  }
});

castingCallsRouter.post("/", async (req, res) => {
  try {
    const { projectId } = CreateCastingCallParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateCastingCallBody.parse(req.body);
    const [call] = await db
      .insert(castingCallsTable)
      .values({
        ...body,
        projectId,
        skills: body.skills ? JSON.stringify(body.skills) : null,
      })
      .returning();
    res.status(201).json(serializeCall(call));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid casting call data" });
  }
});

castingCallsRouter.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateCastingCallParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateCastingCallBody.parse(req.body);
    const [updated] = await db
      .update(castingCallsTable)
      .set({ ...body, skills: body.skills ? JSON.stringify(body.skills) : undefined })
      .where(and(eq(castingCallsTable.id, id), eq(castingCallsTable.projectId, projectId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(serializeCall(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

castingCallsRouter.delete("/:id", async (req, res) => {
  try {
    const { projectId, id } = DeleteCastingCallParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(castingCallsTable).where(and(eq(castingCallsTable.id, id), eq(castingCallsTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serializeCall(c: typeof castingCallsTable.$inferSelect) {
  return {
    ...c,
    skills: c.skills ? tryParse(c.skills) : null,
    createdAt: c.createdAt.toISOString(),
  };
}

export const castMembersRouter = Router({ mergeParams: true });

castMembersRouter.get("/", async (req, res) => {
  try {
    const { projectId } = ListCastMembersParams.parse({ projectId: Number(req.params.projectId) });
    const members = await db.select().from(castMembersTable).where(eq(castMembersTable.projectId, projectId));
    res.json(members.map(serializeMember));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list cast members" });
  }
});

castMembersRouter.post("/", async (req, res) => {
  try {
    const { projectId } = CreateCastMemberParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateCastMemberBody.parse(req.body);
    const [member] = await db
      .insert(castMembersTable)
      .values({ ...body, projectId })
      .returning();
    res.status(201).json(serializeMember(member));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid cast member data" });
  }
});

castMembersRouter.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateCastMemberParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateCastMemberBody.parse(req.body);
    const [updated] = await db
      .update(castMembersTable)
      .set(body)
      .where(and(eq(castMembersTable.id, id), eq(castMembersTable.projectId, projectId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(serializeMember(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

castMembersRouter.delete("/:id", async (req, res) => {
  try {
    const { projectId, id } = DeleteCastMemberParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(castMembersTable).where(and(eq(castMembersTable.id, id), eq(castMembersTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serializeMember(m: typeof castMembersTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

function tryParse(v: string) {
  try { return JSON.parse(v); } catch { return []; }
}
