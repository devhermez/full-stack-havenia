import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import { requireRole } from "../auth/roles";
import { listUsers, setUserRole, listAllOrders, listAllReservations } from "./controller";

const router = Router();

router.use(requireAuth, requireRole("admin", "staff"));

router.get("/users", listUsers);
router.put("/users/:id/role", requireRole("admin"), setUserRole);

router.get("/orders", listAllOrders);
router.get("/reservations", listAllReservations);

export default router;