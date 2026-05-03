import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import charactersRouter from "./characters";
import beatsRouter from "./beats";
import mindmapRouter from "./mindmap";
import scenesRouter from "./scenes";
import { castingCallsRouter, castMembersRouter } from "./casting";
import crewRouter from "./crew";
import shotsRouter from "./shots";
import budgetRouter from "./budget";
import lightingRouter from "./lighting";
import packetsRouter from "./packets";
import distributionRouter from "./distribution";
import distributionStrategyRouter from "./distribution-strategy";
import { milestonesRouter, deliverablesRouter } from "./post-production";

const router: IRouter = Router();

router.use("/healthz", healthRouter);
router.use("/projects", projectsRouter);

router.use("/projects/:projectId/characters", charactersRouter);
router.use("/projects/:projectId/beats", beatsRouter);
router.use("/projects/:projectId/mindmap", mindmapRouter);
router.use("/projects/:projectId/scenes", scenesRouter);
router.use("/projects/:projectId/casting", castingCallsRouter);
router.use("/projects/:projectId/cast", castMembersRouter);
router.use("/projects/:projectId/crew", crewRouter);
router.use("/projects/:projectId/shots", shotsRouter);
router.use("/projects/:projectId/budget", budgetRouter);
router.use("/projects/:projectId/lighting", lightingRouter);
router.use("/projects/:projectId/packets", packetsRouter);
router.use("/projects/:projectId/distribution", distributionRouter);
router.use("/projects/:projectId/distribution-strategy", distributionStrategyRouter);
router.use("/projects/:projectId/post-milestones", milestonesRouter);
router.use("/projects/:projectId/deliverables", deliverablesRouter);

export default router;
