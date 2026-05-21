import { Router } from "express";
import * as paymentsController from "./payments.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import { paymentsSummarySchema } from "./payments.schema.js";

const router = Router();

router.use(authenticate);

router.get(
  "/summary",
  requireRole("super_admin", "admin"),
  validate(paymentsSummarySchema, "query"),
  paymentsController.getPaymentsSummary
);

router.get(
  "/export",
  requireRole("super_admin", "admin"),
  validate(paymentsSummarySchema, "query"),
  paymentsController.getPaymentsPdf
);

// Tek-transaction fiş indirme (mobile "Fişi İndir"). Owner kontrolü
// service katmanında: user role sadece kendi transaction'ını çekebilir.
router.get("/receipt/:transactionId", paymentsController.getMyReceiptPdf);

export default router;
