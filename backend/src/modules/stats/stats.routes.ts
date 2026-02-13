import { Router } from "express";
import * as statsController from "./stats.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roleGuard.js";

const router = Router();

router.use(authenticate);

router.get(
  "/overview",
  requireRole("super_admin", "admin"),
  statsController.getOverview
);

router.get(
  "/usage",
  requireRole("super_admin", "admin"),
  statsController.getUsage
);

export default router;
