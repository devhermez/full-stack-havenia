import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import {
  listRooms,
  getRoom,
  createReservation,
  listMyReservations,
  getMyReservation,
  cancelMyReservation,
} from "./controller";

const router = Router();

/**
 * @openapi
 * /api/v1/rooms:
 *   get:
 *     summary: List rooms (optionally check availability in date range)
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: property_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: min_capacity
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Rooms list (with optional est_total/nights)
 *       422:
 *         description: Validation error
 */
// Rooms (availability listing)
router.get("/", listRooms);

// Reservations (user)
router.post("/reservations", requireAuth, createReservation);
router.get("/reservations", requireAuth, listMyReservations);
router.get("/reservations/:id", requireAuth, getMyReservation);
router.put("/reservations/:id/cancel", requireAuth, cancelMyReservation);

router.get("/:id", getRoom);

export default router;
