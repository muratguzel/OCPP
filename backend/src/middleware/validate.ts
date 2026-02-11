import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export function validate(schema: ZodSchema, source: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === "query" ? req.query : req.body;
      const parsed = schema.parse(data);
      if (source === "query") {
        req.validatedQuery = parsed as Record<string, unknown>;
      } else {
        req.body = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({ error: "Validation failed", details: errors });
        return;
      }
      next(err);
    }
  };
}
