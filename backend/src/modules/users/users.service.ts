import { eq } from "drizzle-orm";
import { db } from "../../config/database.js";
import { users, tenants } from "../../config/schema.js";
import { hashPassword } from "../../utils/password.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schema.js";

type Role = "super_admin" | "admin" | "user";

const userListColumns = {
  id: true,
  email: true,
  name: true,
  role: true,
  tenantId: true,
  numaraTaj: true,
  phone: true,
  isActive: true,
  createdById: true,
  createdAt: true,
};

export async function listUsers(
  requesterId: string,
  requesterRole: Role,
  requesterTenantId: string | undefined,
  filterTenantId?: string
) {
  if (requesterRole === "super_admin") {
    const conditions = filterTenantId
      ? eq(users.tenantId, filterTenantId)
      : undefined;
    return db.query.users.findMany({
      where: conditions,
      columns: userListColumns,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
  }

  if (requesterRole === "admin" && requesterTenantId) {
    return db.query.users.findMany({
      where: eq(users.tenantId, requesterTenantId),
      columns: userListColumns,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
  }

  throw new AppError(403, "Insufficient permissions");
}

export async function getUserById(
  id: string,
  requesterId: string,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      numaraTaj: true,
      phone: true,
      isActive: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (requesterRole === "user" && user.id !== requesterId) {
    throw new AppError(403, "Insufficient permissions");
  }

  if (requesterRole === "admin") {
    if (user.id !== requesterId && user.tenantId !== requesterTenantId) {
      throw new AppError(403, "Insufficient permissions");
    }
  }

  return user;
}

export async function createUser(
  input: CreateUserInput,
  creatorId: string,
  creatorRole: Role,
  creatorTenantId: string | undefined
) {
  if (creatorRole === "admin") {
    if (input.role !== "user") {
      throw new AppError(403, "Admins cannot create other admins");
    }
    if (!creatorTenantId) {
      throw new AppError(403, "Admin must belong to a tenant");
    }
  }

  let tenantId: string | null = null;

  if (creatorRole === "super_admin") {
    if (input.role === "admin") {
      if (!input.tenantId) {
        throw new AppError(400, "tenantId is required when creating an admin");
      }
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, input.tenantId!),
      });
      if (!tenant) {
        throw new AppError(404, "Tenant not found");
      }
      tenantId = input.tenantId;
    } else {
      if (!input.tenantId) {
        throw new AppError(400, "tenantId is required when creating a user");
      }
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, input.tenantId!),
      });
      if (!tenant) {
        throw new AppError(404, "Tenant not found");
      }
      tenantId = input.tenantId;
    }
  } else {
    tenantId = creatorTenantId ?? null;
  }

  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (existingEmail) {
    throw new AppError(409, "Email already in use");
  }

  const existingPhone = await db.query.users.findFirst({
    where: eq(users.phone, input.phone),
  });
  if (existingPhone) {
    throw new AppError(409, "Phone number already in use");
  }

  const hashedPassword = await hashPassword(input.password);

  const [newUser] = await db
    .insert(users)
    .values({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: input.role,
      tenantId,
      numaraTaj: input.numaraTaj,
      phone: input.phone,
      createdById: creatorId,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tenantId: users.tenantId,
      numaraTaj: users.numaraTaj,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });

  return newUser;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  requesterId: string,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  const target = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!target) {
    throw new AppError(404, "User not found");
  }

  if (requesterRole === "user" && target.id !== requesterId) {
    throw new AppError(403, "Insufficient permissions");
  }

  if (requesterRole === "admin") {
    if (target.id !== requesterId && target.tenantId !== requesterTenantId) {
      throw new AppError(403, "Insufficient permissions");
    }
  }

  if (target.role === "super_admin" && requesterRole !== "super_admin") {
    throw new AppError(403, "Cannot modify a super admin");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.email !== undefined) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (existing && existing.id !== id) {
      throw new AppError(409, "Email already in use");
    }
    updateData.email = input.email;
  }

  if (input.password !== undefined) {
    updateData.password = await hashPassword(input.password);
  }

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.isActive !== undefined) {
    if (requesterRole === "user") {
      throw new AppError(403, "Users cannot change active status");
    }
    updateData.isActive = input.isActive;
  }

  if (input.numaraTaj !== undefined) {
    updateData.numaraTaj = input.numaraTaj;
  }

  if (input.phone !== undefined) {
    const existingPhone = await db.query.users.findFirst({
      where: eq(users.phone, input.phone),
    });
    if (existingPhone && existingPhone.id !== id) {
      throw new AppError(409, "Phone number already in use");
    }
    updateData.phone = input.phone;
  }

  if (input.role !== undefined) {
    if (requesterRole !== "super_admin") {
      throw new AppError(403, "Only super admin can change roles");
    }
    if (target.id === requesterId) {
      throw new AppError(400, "Cannot change your own role");
    }
    updateData.role = input.role;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tenantId: users.tenantId,
      numaraTaj: users.numaraTaj,
      phone: users.phone,
      isActive: users.isActive,
      updatedAt: users.updatedAt,
    });

  return updated;
}

export async function deleteUser(
  id: string,
  requesterId: string,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  const target = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!target) {
    throw new AppError(404, "User not found");
  }

  if (requesterRole !== "super_admin") {
    throw new AppError(403, "Only super admin can delete users");
  }

  if (target.id === requesterId) {
    throw new AppError(400, "Cannot delete yourself");
  }

  if (target.role === "super_admin") {
    throw new AppError(403, "Cannot delete a super admin");
  }

  const [deleted] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      tenantId: users.tenantId,
      isActive: users.isActive,
    });

  return deleted;
}
