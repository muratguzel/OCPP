import { Router } from "express";
import * as tenantsController from "./tenants.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import {
  createTenantSchema,
  updateTenantSchema,
} from "./tenants.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", requireRole("super_admin"), tenantsController.listTenants);
router.get(
  "/:id",
  requireRole("super_admin", "admin"),
  tenantsController.getTenantById
);
router.post(
  "/",
  requireRole("super_admin"),
  validate(createTenantSchema),
  tenantsController.createTenant
);
router.patch(
  "/:id",
  requireRole("super_admin", "admin"),
  validate(updateTenantSchema),
  tenantsController.updateTenant
);
router.delete("/:id", requireRole("super_admin"), tenantsController.deleteTenant);

export default router;
