import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import chargePointsRoutes from "./modules/charge-points/charge-points.routes.js";
import tenantsRoutes from "./modules/tenants/tenants.routes.js";
import usersRoutes from "./modules/users/users.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenants", tenantsRoutes);
router.use("/users", usersRoutes);
router.use("/charge-points", chargePointsRoutes);

export default router;
