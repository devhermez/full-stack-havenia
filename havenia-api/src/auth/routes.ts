import { Router } from "express";
import { register, login, updateMe } from "./controller";
import { requireAuth } from "./middleware";

const router = Router();

router.post("/register", register);
/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: "#/components/schemas/User" }
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 */
router.post("/login", login);
router.get("/me", requireAuth, updateMe);

export default router;
