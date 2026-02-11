import { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service.js";
import { buildReceiptPdf } from "./pdfExport.js";
import type { PaymentsSummaryInput } from "./payments.schema.js";

type Role = "super_admin" | "admin" | "user";

export async function getPaymentsSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = (req.validatedQuery ?? req.query) as PaymentsSummaryInput;
    const data = await paymentsService.getPaymentsSummary(
      req.user!.role as Role,
      req.user!.tenantId ?? undefined,
      input
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getPaymentsPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = (req.validatedQuery ?? req.query) as PaymentsSummaryInput;
    const data = await paymentsService.getPaymentsExportData(
      req.user!.role as Role,
      req.user!.tenantId,
      input
    );
    const pdf = await buildReceiptPdf({
      startDate: data.startDate,
      endDate: data.endDate,
      totalCost: data.totalCost,
      totalKwh: data.totalKwh,
      sessionCount: data.sessionCount,
      rows: data.rows.map((r) => ({
        ...r,
        startTime: new Date(r.startTime),
        endTime: r.endTime ? new Date(r.endTime) : null,
      })),
    });
    const filename = `odeme-fisi-${data.startDate}-${data.endDate}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}
