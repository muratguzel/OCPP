import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import type {
  LoginInput,
  RefreshInput,
  ChangePasswordInput,
} from "./auth.schema.js";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshInput;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshInput;
    await authService.logout(req.user!.userId, refreshToken);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    await authService.changePassword(
      req.user!.userId,
      currentPassword,
      newPassword
    );
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}
