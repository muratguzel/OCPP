import { Router } from "express";
import * as chargeController from "./charge.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  startChargeSchema,
  getPriceQuerySchema,
  webhookTransactionStartedSchema,
  webhookTransactionStoppedSchema,
} from "./charge.schema.js";

const router = Router();

/** Public: get price per kWh and VAT for a charge point (for live cost display during charging). */
router.get(
  "/price",
  validate(getPriceQuerySchema, "query"),
  chargeController.getPrice
);

router.post(
  "/start",
  authenticate,
  requireRole("super_admin", "admin", "user"),
  validate(startChargeSchema),
  chargeController.startCharge
);

router.post(
  "/webhook/transaction-started",
  validate(webhookTransactionStartedSchema),
  chargeController.webhookTransactionStarted
);

router.post(
  "/webhook/transaction-stopped",
  validate(webhookTransactionStoppedSchema),
  chargeController.webhookTransactionStopped
);

export default router;
