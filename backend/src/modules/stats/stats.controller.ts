import { Request, Response, NextFunction } from "express";
import * as statsService from "./stats.service.js";

type Role = "super_admin" | "admin" | "user";

export async function getOverview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId =
      typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
    const data = await statsService.getOverview(
      req.user!.role as Role,
      req.user!.tenantId,
      tenantId
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getUsage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId =
      typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
    const period =
      (req.query.period as "day" | "week") === "week" ? "week" : "day";

    const data = await statsService.getUsage(
      req.user!.role as Role,
      req.user!.tenantId,
      tenantId,
      period
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}
