import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { createOrder, listMyOrders, getMyOrder } from "./controller";

const router = Router();

router.get("/", requireAuth, listMyOrders);
router.post("/", requireAuth, createOrder);
router.get("/:id", requireAuth, getMyOrder);

export default router;
