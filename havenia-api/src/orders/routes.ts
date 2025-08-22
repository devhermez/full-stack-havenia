import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { createOrder, listMyOrders, getMyOrder } from "./controller";
import { paymentsLimiter } from "../middleware/rateLimit";

const router = Router();

router.get("/", requireAuth, listMyOrders);
/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     summary: Create order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [delivery_type, items]
 *             properties:
 *               property_id: { type: string, format: uuid, nullable: true }
 *               delivery_type: { type: string, enum: [pickup, delivery] }
 *               address_id: { type: string, format: uuid, nullable: true }
 *               scheduled_ts: { type: string, format: date-time, nullable: true }
 *               notes: { type: string, nullable: true }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [menu_item_id, qty]
 *                   properties:
 *                     menu_item_id: { type: "string", format: "uuid" }
 *                     qty: { type: "integer", minimum: 1 }
 *                     notes: { type: "string", nullable: true }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order: { $ref: "#/components/schemas/Order" }
 *       401: { description: Unauthorized }
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
router.post("/", paymentsLimiter, requireAuth, createOrder);
router.get("/:id", requireAuth, getMyOrder);

export default router;
