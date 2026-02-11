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
    const role = req.user!.role as string;
    const userTenantId = req.user!.tenantId;
    if (role === "admin" && req.params.id !== userTenantId) {
      res.status(403).json({ error: "Can only view own tenant" });
      return;
    }
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
    const role = req.user!.role as string;
    const userTenantId = req.user!.tenantId;
    if (role === "admin" && req.params.id !== userTenantId) {
      res.status(403).json({ error: "Can only update own tenant" });
      return;
    }
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
