import PDFDocument from "pdfkit";

export interface ExportRow {
  startTime: Date;
  endTime: Date | null;
  chargePointId: string;
  kwh: number;
  cost: number;
  userName: string;
  numaraTaj: string;
}

export interface ExportData {
  startDate: string;
  endDate: string;
  totalCost: number;
  totalKwh: number;
  sessionCount: number;
  rows: ExportRow[];
}

export function buildReceiptPdf(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Şarj Modül - Ödeme Fişi", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Tarih Aralığı: ${data.startDate} - ${data.endDate}`);
    doc.text(`Toplam Oturum: ${data.sessionCount}`);
    doc.text(`Toplam kWh: ${data.totalKwh.toFixed(2)}`);
    doc.text(`Toplam Tutar: ₺${data.totalCost.toFixed(2)}`);
    doc.moveDown();

    const tableTop = doc.y;
    const colWidths = { date: 90, user: 80, numaraTaj: 70, cp: 60, kwh: 50, cost: 60 };
    const rowHeight = 20;

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Tarih", 50, tableTop, { width: colWidths.date });
    doc.text("Kullanıcı", 50 + colWidths.date, tableTop, { width: colWidths.user });
    doc.text("Numarataj", 50 + colWidths.date + colWidths.user, tableTop, {
      width: colWidths.numaraTaj,
    });
    doc.text("İstasyon", 50 + colWidths.date + colWidths.user + colWidths.numaraTaj, tableTop, {
      width: colWidths.cp,
    });
    doc.text("kWh", 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.cp, tableTop, {
      width: colWidths.kwh,
    });
    doc.text("Tutar", 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.cp + colWidths.kwh, tableTop, {
      width: colWidths.cost,
    });

    doc.font("Helvetica");

    let y = tableTop + rowHeight;
    for (const row of data.rows) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      const startStr = row.startTime.toISOString().slice(0, 16).replace("T", " ");
      doc.text(startStr, 50, y, { width: colWidths.date });
      doc.text(row.userName.slice(0, 12), 50 + colWidths.date, y, {
        width: colWidths.user,
      });
      doc.text(row.numaraTaj, 50 + colWidths.date + colWidths.user, y, {
        width: colWidths.numaraTaj,
      });
      doc.text(row.chargePointId, 50 + colWidths.date + colWidths.user + colWidths.numaraTaj, y, {
        width: colWidths.cp,
      });
      doc.text(row.kwh.toFixed(2), 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.cp, y, {
        width: colWidths.kwh,
      });
      doc.text(`₺${row.cost.toFixed(2)}`, 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.cp + colWidths.kwh, y, {
        width: colWidths.cost,
      });
      y += rowHeight;
    }

    doc.moveDown(2);
    doc.font("Helvetica-Bold").text(`Genel Toplam: ₺${data.totalCost.toFixed(2)}`);
    doc.text(`Toplam kWh: ${data.totalKwh.toFixed(2)}`);

    doc.end();
  });
}
