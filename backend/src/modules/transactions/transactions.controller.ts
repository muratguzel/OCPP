import { Request, Response, NextFunction } from "express";
import * as transactionsService from "./transactions.service.js";

type Role = "super_admin" | "admin" | "user";

export async function listTransactions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId =
      typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
    const userId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;

    const list = await transactionsService.listTransactions(
      req.user!.role as Role,
      req.user!.tenantId,
      req.user!.userId,
      tenantId,
      userId
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
}
