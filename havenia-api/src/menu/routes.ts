import { Router } from "express";
import {
  listMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "./controller";
import { requireAuth } from "../auth/middleware";
// Optional role guard
// const requireRole = (role: string) => (req, res, next) =>
//   req.user?.role === role ? next() : res.status(403).json({ error: { message: "Forbidden" } });

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
 *       422:
 *         description: Invalid query
 *       500:
 *         description: Server error
 */
router.get("/", listMenu);

/**
 * @openapi
 * /api/v1/menu/{id}:
 *   get:
 *     summary: Get a menu item
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Menu item
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/MenuItem" }
 *       404:
 *         description: Not found
 */
router.get("/:id", getMenuItem);

/**
 * @openapi
 * /api/v1/menu:
 *   post:
 *     summary: Create a menu item
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/MenuItemCreate" }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/MenuItem" }
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post("/", requireAuth /*, requireRole('admin')*/, createMenuItem);

/**
 * @openapi
 * /api/v1/menu/{id}:
 *   put:
 *     summary: Update a menu item
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/MenuItemUpdate" }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/MenuItem" }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       422:
 *         description: Validation error
 */
router.put("/:id", requireAuth /*, requireRole('admin')*/, updateMenuItem);

/**
 * @openapi
 * /api/v1/menu/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.delete("/:id", requireAuth /*, requireRole('admin')*/, deleteMenuItem);



export default router;