import { Request, Response, NextFunction } from "express";
import * as chargeService from "./charge.service.js";

export async function startCharge(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const result = await chargeService.startCharge(userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhookTransactionStarted(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await chargeService.webhookTransactionStarted(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function webhookTransactionStopped(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await chargeService.webhookTransactionStopped(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
