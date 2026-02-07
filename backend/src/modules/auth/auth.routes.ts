import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, refreshSchema } from "./auth.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post(
  "/logout",
  authenticate,
  validate(refreshSchema),
  authController.logout
);
router.get("/me", authenticate, authController.getMe);

export default router;
