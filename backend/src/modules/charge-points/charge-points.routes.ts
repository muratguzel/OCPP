import { Router } from "express";
import * as chargePointsController from "./charge-points.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  createChargePointSchema,
  updateChargePointSchema,
} from "./charge-points.schema.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("super_admin", "admin"));

router.get("/", chargePointsController.listChargePoints);
router.get("/:id", chargePointsController.getChargePointById);
router.post(
  "/",
  validate(createChargePointSchema),
  chargePointsController.createChargePoint
);
router.patch(
  "/:id",
  validate(updateChargePointSchema),
  chargePointsController.updateChargePoint
);
router.delete(
  "/:id",
  requireRole("super_admin"),
  chargePointsController.deleteChargePoint
);

export default router;
