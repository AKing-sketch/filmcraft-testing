import { Router } from "express";
import { db } from "@workspace/db";
import { scenesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  ListScenesParams,
  CreateSceneParams,
  CreateSceneBody,
  GetSceneParams,
  UpdateSceneParams,
  UpdateSceneBody,
  DeleteSceneParams,
  GetScriptBreakdownParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/breakdown", async (req, res) => {
  try {
    const { projectId } = GetScriptBreakdownParams.parse({ projectId: Number(req.params.projectId) });
    const scenes = await db.select().from(scenesTable).where(eq(scenesTable.projectId, projectId));

    const totalPages = scenes.reduce((s, scene) => s + (scene.pages ?? 0), 0);
    const intCount = scenes.filter((s) => s.intExt === "INT").length;
    const extCount = scenes.filter((s) => s.intExt === "EXT").length;
    const dayCount = scenes.filter((s) => s.timeOfDay === "DAY").length;
    const nightCount = scenes.filter((s) => s.timeOfDay === "NIGHT").length;

    const uniqueLocations = [...new Set(scenes.map((s) => s.location).filter(Boolean))] as string[];
    const uniqueCharacters = [
      ...new Set(
        scenes.flatMap((s) => {
          try {
            return s.characters ? JSON.parse(s.characters) : [];
          } catch {
            return [];
          }
        })
      ),
    ] as string[];

    const locationCounts: Record<string, number> = {};
    for (const scene of scenes) {
      if (scene.location) {
        locationCounts[scene.location] = (locationCounts[scene.location] ?? 0) + 1;
      }
    }
    const scenesByLocation = Object.entries(locationCounts).map(([location, count]) => ({ location, count }));

    res.json({
      totalScenes: scenes.length,
      totalPages,
      intCount,
      extCount,
      dayCount,
      nightCount,
      uniqueLocations,
      uniqueCharacters,
      scenesByLocation,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get breakdown" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { projectId } = ListScenesParams.parse({ projectId: Number(req.params.projectId) });
    const scenes = await db
      .select()
      .from(scenesTable)
      .where(eq(scenesTable.projectId, projectId))
      .orderBy(asc(scenesTable.sceneNumber));
    res.json(scenes.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list scenes" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = CreateSceneParams.parse({ projectId: Number(req.params.projectId) });
    const body = CreateSceneBody.parse(req.body);
    const [scene] = await db
      .insert(scenesTable)
      .values({
        ...body,
        projectId,
        characters: body.characters ? JSON.stringify(body.characters) : null,
        props: body.props ? JSON.stringify(body.props) : null,
        costumes: body.costumes ? JSON.stringify(body.costumes) : null,
        makeupFx: body.makeupFx ? JSON.stringify(body.makeupFx) : null,
      })
      .returning();
    res.status(201).json(serialize(scene));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid scene data" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { projectId, id } = GetSceneParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const [scene] = await db
      .select()
      .from(scenesTable)
      .where(and(eq(scenesTable.id, id), eq(scenesTable.projectId, projectId)));
    if (!scene) return res.status(404).json({ error: "Not found" });
    res.json(serialize(scene));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get scene" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { projectId, id } = UpdateSceneParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    const body = UpdateSceneBody.parse(req.body);
    const [updated] = await db
      .update(scenesTable)
      .set({
        ...body,
        characters: body.characters ? JSON.stringify(body.characters) : undefined,
        props: body.props ? JSON.stringify(body.props) : undefined,
        costumes: body.costumes ? JSON.stringify(body.costumes) : undefined,
        makeupFx: body.makeupFx ? JSON.stringify(body.makeupFx) : undefined,
      })
      .where(and(eq(scenesTable.id, id), eq(scenesTable.projectId, projectId)))
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
    const { projectId, id } = DeleteSceneParams.parse({
      projectId: Number(req.params.projectId),
      id: Number(req.params.id),
    });
    await db.delete(scenesTable).where(and(eq(scenesTable.id, id), eq(scenesTable.projectId, projectId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

function serialize(s: typeof scenesTable.$inferSelect) {
  return {
    ...s,
    characters: s.characters ? tryParse(s.characters) : null,
    props: s.props ? tryParse(s.props) : null,
    costumes: s.costumes ? tryParse(s.costumes) : null,
    makeupFx: s.makeupFx ? tryParse(s.makeupFx) : null,
    createdAt: s.createdAt.toISOString(),
  };
}

function tryParse(v: string) {
  try { return JSON.parse(v); } catch { return []; }
}

export default router;
