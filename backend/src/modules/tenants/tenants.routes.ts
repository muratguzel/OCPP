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
router.use(requireRole("super_admin"));

router.get("/", tenantsController.listTenants);
router.get("/:id", tenantsController.getTenantById);
router.post("/", validate(createTenantSchema), tenantsController.createTenant);
router.patch(
  "/:id",
  validate(updateTenantSchema),
  tenantsController.updateTenant
);
router.delete("/:id", tenantsController.deleteTenant);

export default router;
