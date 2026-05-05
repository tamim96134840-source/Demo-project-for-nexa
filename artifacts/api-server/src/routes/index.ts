import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import shopsRouter from "./shops";
import ordersRouter from "./orders";
import ridersRouter from "./riders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(shopsRouter);
router.use(ordersRouter);
router.use(ridersRouter);

export default router;
