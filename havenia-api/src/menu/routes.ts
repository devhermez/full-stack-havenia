import { Router } from "express";
import { listMenu } from "./controller";

const router = Router();

router.get("/", listMenu);

export default router;