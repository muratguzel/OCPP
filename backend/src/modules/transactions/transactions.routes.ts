import { Router } from "express";
import * as transactionsController from "./transactions.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", transactionsController.listTransactions);

export default router;
