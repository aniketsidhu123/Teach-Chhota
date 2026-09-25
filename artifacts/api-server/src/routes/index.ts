import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ragRouter from "./rag";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ragRouter);

export default router;
