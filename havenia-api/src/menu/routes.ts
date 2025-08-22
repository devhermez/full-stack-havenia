import { Router } from "express";
import { listMenu } from "./controller";

const router = Router();

/**
 * @openapi
 * /api/v1/menu:
 *   get:
 *     summary: List menu items
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: property_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/MenuItem" }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
router.get("/", listMenu);

export default router;