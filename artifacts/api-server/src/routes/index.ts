import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ragRouter from "./rag";
import authRouter from "./auth";
import gamificationRouter from "./gamification";
import friendsRouter from "./friends";
import profileRouter from "./profile";
import shopRouter from "./shop";
import leaderboardRouter from "./leaderboard";
import bugBountyRouter from "./bug-bounty";
import subscriptionRouter from "./subscription";
import roadmapsRouter from "./roadmaps";

const router: IRouter = Router();

// Existing routes (untouched)
router.use(healthRouter);
router.use(ragRouter);

// New gamification routes
router.use(authRouter);
router.use(gamificationRouter);
router.use(friendsRouter);
router.use(profileRouter);
router.use(shopRouter);
router.use(leaderboardRouter);
router.use(bugBountyRouter);
router.use(subscriptionRouter);
router.use(roadmapsRouter);

export default router;
