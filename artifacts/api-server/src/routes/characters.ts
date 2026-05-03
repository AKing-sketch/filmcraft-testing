import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCharactersParams,
  CreateCharacterParams,
  CreateCharacterBody,
  GetCharacterParams,
  UpdateCharacterParams,
  UpdateCharacterBody,
  DeleteCharacterParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListCharactersParams.parse({ projectId: Number(req.params.projectId) });
    const characters = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.projectId, projectId));
    res.json(characters.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list characters" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateCharacterParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateCharacterBody.parse(req.body);
    const [character] = await db
      .insert(charactersTable)
      .values({ ...body, projectId })
      .returning();
    res.status(201).json(serialize(character));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid character data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { projectId, id } = GetCharacterParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const [character] = await db
      .select()
      .from(charactersTable)
      .where(and(eq(charactersTable.id, id), eq(charactersTable.projectId, projectId)));
    if (!character) return res.status(404).json({ error: "Not found" });
    res.json(serialize(character));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get character" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateCharacterParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateCharacterBody.parse(req.body);
    const [updated] = await db
      .update(charactersTable)
      .set(body)
      .where(and(eq(charactersTable.id, id), eq(charactersTable.projectId, projectId)))
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
    const { projectId, id } = DeleteCharacterParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(charactersTable).where(and(eq(charactersTable.id, id), eq(charactersTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(c: typeof charactersTable.$inferSelect) {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

export default router;
