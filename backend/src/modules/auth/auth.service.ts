import { eq } from "drizzle-orm";
import { db } from "../../config/database.js";
import { redis } from "../../config/redis.js";
import { users, tenants } from "../../config/schema.js";
import { comparePassword } from "../../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
  TokenPayload,
} from "../../utils/jwt.js";
import { AppError } from "../../middleware/errorHandler.js";

function buildRefreshKey(userId: string, token: string): string {
  return `refresh:${userId}:${token}`;
}

export async function login(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    ...(user.tenantId && { tenantId: user.tenantId }),
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await redis.set(
    buildRefreshKey(user.id, refreshToken),
    "1",
    "EX",
    REFRESH_TOKEN_TTL_SECONDS
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.tenantId && { tenantId: user.tenantId }),
    },
  };
}

export async function refresh(refreshToken: string) {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const key = buildRefreshKey(payload.userId, refreshToken);
  const exists = await redis.get(key);

  if (!exists) {
    throw new AppError(401, "Refresh token has been revoked");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "User not found or inactive");
  }

  const newPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    ...(user.tenantId && { tenantId: user.tenantId }),
  };

  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  // Revoke old, store new
  await redis.del(key);
  await redis.set(
    buildRefreshKey(user.id, newRefreshToken),
    "1",
    "EX",
    REFRESH_TOKEN_TTL_SECONDS
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(userId: string, refreshToken: string) {
  const key = buildRefreshKey(userId, refreshToken);
  await redis.del(key);
}

export async function getMe(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const result: Record<string, unknown> = { ...user };
  if (user.tenantId) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
      columns: { name: true },
    });
    if (tenant) result.tenantName = tenant.name;
  }
  return result;
}
