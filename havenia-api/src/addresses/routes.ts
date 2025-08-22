import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import {
  listMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  makeDefaultAddress,
} from "./controller";

const router = Router();
router.get("/", requireAuth, listMyAddresses);
router.post("/", requireAuth, createAddress);
router.put("/:id", requireAuth, updateAddress);
router.delete("/:id", requireAuth, deleteAddress);
router.put("/:id/default", requireAuth, makeDefaultAddress);

export default router;