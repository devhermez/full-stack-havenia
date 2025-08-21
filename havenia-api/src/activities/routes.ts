import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import {
  listActivities,
  listSessions,
  createBooking,
  listMyActivityBookings,
  cancelMyActivityBooking,
  getActivityDetail,
} from "./controller";

const router = Router();

// Activities catalog
router.get("/", listActivities);
router.get("/:id", getActivityDetail)
router.get("/:id/sessions", listSessions);

// Bookings (user)
router.post("/:id/bookings", requireAuth, createBooking);
router.get("/me/bookings", requireAuth, listMyActivityBookings);
router.put("/me/bookings/:id/cancel", requireAuth, cancelMyActivityBooking);

export default router;
