import { Request, Response, NextFunction } from "express";
import * as tenantsService from "./tenants.service.js";
import type { CreateTenantInput, UpdateTenantInput } from "./tenants.schema.js";

export async function listTenants(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const list = await tenantsService.listTenants();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function getTenantById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = await tenantsService.getTenantById(req.params.id);
    res.json(tenant);
  } catch (err) {
    next(err);
  }
}

export async function createTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = await tenantsService.createTenant(
      req.body as CreateTenantInput
    );
    res.status(201).json(tenant);
  } catch (err) {
    next(err);
  }
}

export async function updateTenant(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = await tenantsService.updateTenant(
      req.params.id,
      req.body as UpdateTenantInput
    );
    res.json(tenant);
  } catch (err) {
    next(err);
  }
}

export async function deleteTenant(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenant = await tenantsService.deleteTenant(req.params.id);
    res.json(tenant);
  } catch (err) {
    next(err);
  }
}
