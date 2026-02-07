import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import chargePointsRoutes from "./modules/charge-points/charge-points.routes.js";
import chargeRoutes from "./modules/charge/charge.routes.js";
import tenantsRoutes from "./modules/tenants/tenants.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import statsRoutes from "./modules/stats/stats.routes.js";
import transactionsRoutes from "./modules/transactions/transactions.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenants", tenantsRoutes);
router.use("/users", usersRoutes);
router.use("/charge-points", chargePointsRoutes);
router.use("/charge", chargeRoutes);
router.use("/stats", statsRoutes);
router.use("/transactions", transactionsRoutes);

export default router;
