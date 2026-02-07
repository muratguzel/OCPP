import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schema.js";

type Role = "super_admin" | "admin" | "user";

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantIdFilter =
      typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
    const users = await usersService.listUsers(
      req.user!.userId,
      req.user!.role as Role,
      req.user!.tenantId,
      tenantIdFilter
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.getUserById(
      req.params.id,
      req.user!.userId,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.createUser(
      req.body as CreateUserInput,
      req.user!.userId,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.updateUser(
      req.params.id,
      req.body as UpdateUserInput,
      req.user!.userId,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.deleteUser(
      req.params.id,
      req.user!.userId,
      req.user!.role as Role,
      req.user!.tenantId
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
}
