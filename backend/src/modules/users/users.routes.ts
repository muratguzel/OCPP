import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/roleGuard.js";
import { validate } from "../../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./users.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// List users - Admin and Super Admin only
router.get(
  "/",
  requireRole("super_admin", "admin"),
  usersController.listUsers
);

// Get user by ID - All authenticated users (ownership checked in service)
router.get("/:id", usersController.getUserById);

// Create user - Admin and Super Admin only
router.post(
  "/",
  requireRole("super_admin", "admin"),
  validate(createUserSchema),
  usersController.createUser
);

// Update user - All authenticated users (ownership checked in service)
router.patch("/:id", validate(updateUserSchema), usersController.updateUser);

// Delete (deactivate) user - Admin and Super Admin only
router.delete(
  "/:id",
  requireRole("super_admin", "admin"),
  usersController.deleteUser
);

export default router;
