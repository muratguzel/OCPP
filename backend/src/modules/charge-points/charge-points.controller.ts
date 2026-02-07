import { Request, Response, NextFunction } from "express";
import * as chargePointsService from "./charge-points.service.js";
import type {
  CreateChargePointInput,
  UpdateChargePointInput,
} from "./charge-points.schema.js";

type Role = "super_admin" | "admin" | "user";

export async function listChargePoints(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantIdFilter =
      typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
    const list = await chargePointsService.listChargePoints(
      req.user!.role as Role,
      req.user!.tenantId,
      tenantIdFilter
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function getChargePointById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cp = await chargePointsService.getChargePointById(
      req.params.id,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.json(cp);
  } catch (err) {
    next(err);
  }
}

export async function createChargePoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cp = await chargePointsService.createChargePoint(
      req.body as CreateChargePointInput,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.status(201).json(cp);
  } catch (err) {
    next(err);
  }
}

export async function updateChargePoint(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cp = await chargePointsService.updateChargePoint(
      req.params.id,
      req.body as UpdateChargePointInput,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.json(cp);
  } catch (err) {
    next(err);
  }
}

export async function deleteChargePoint(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cp = await chargePointsService.deleteChargePoint(
      req.params.id,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.json(cp);
  } catch (err) {
    next(err);
  }
}
