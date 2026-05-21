import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_REGULAR = path.resolve(__dirname, "../../assets/fonts/Roboto-Regular.ttf");
const FONT_BOLD = path.resolve(__dirname, "../../assets/fonts/Roboto-Bold.ttf");
const HAS_FONTS = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD);
const FONT_SANS = HAS_FONTS ? "Sans" : "Helvetica";
const FONT_SANS_BOLD = HAS_FONTS ? "Sans-Bold" : "Helvetica-Bold";

if (!HAS_FONTS) {
  console.warn(
    "[pdfExport] Roboto TTF fonts not found at " +
      FONT_REGULAR +
      " — falling back to Helvetica (Türkçe karakterler bozulabilir)"
  );
}

export interface ExportRow {
  startTime: Date;
  endTime: Date | null;
  chargePointId: string;
  kwh: number;
  cost: number;
  userName: string;
  numaraTaj: string;
  licensePlate?: string;
}

// Türkiye saatine çevirip "YYYY-MM-DD HH:mm" döner.
// Türkiye 2016'dan beri sabit UTC+3 (DST yok), bu yüzden manuel +3 saat güvenli.
function formatTrDateTime(d: Date): string {
  const tr = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return tr.toISOString().slice(0, 16).replace("T", " ");
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

    // Register Turkish-capable Unicode fonts (Roboto). Default Helvetica is Type1
    // and only supports WinAnsi, so characters like ı, ş, ğ, ü, ö, ç, ₺ get mangled.
    if (HAS_FONTS) {
      doc.registerFont("Sans", FONT_REGULAR);
      doc.registerFont("Sans-Bold", FONT_BOLD);
    }
    doc.font(FONT_SANS);

    doc.fontSize(18).font(FONT_SANS_BOLD).text("Şarj Modül - Ödeme Fişi", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font(FONT_SANS).text(`Tarih Aralığı: ${data.startDate} - ${data.endDate}`);
    doc.text(`Toplam Oturum: ${data.sessionCount}`);
    doc.text(`Toplam kWh: ${data.totalKwh.toFixed(2)}`);
    doc.text(`Toplam Tutar: ₺${data.totalCost.toFixed(2)}`);
    doc.moveDown();

    const tableTop = doc.y;
    const colWidths = { date: 78, user: 70, numaraTaj: 50, plate: 60, cp: 55, kwh: 42, cost: 50 };
    const colX = {
      date: 50,
      user: 50 + colWidths.date,
      numaraTaj: 50 + colWidths.date + colWidths.user,
      plate: 50 + colWidths.date + colWidths.user + colWidths.numaraTaj,
      cp: 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.plate,
      kwh: 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.plate + colWidths.cp,
      cost: 50 + colWidths.date + colWidths.user + colWidths.numaraTaj + colWidths.plate + colWidths.cp + colWidths.kwh,
    };
    const rowHeight = 20;

    doc.fontSize(9).font(FONT_SANS_BOLD);
    doc.text("Tarih", colX.date, tableTop, { width: colWidths.date });
    doc.text("Kullanıcı", colX.user, tableTop, { width: colWidths.user });
    doc.text("Numarataj", colX.numaraTaj, tableTop, { width: colWidths.numaraTaj });
    doc.text("Plaka", colX.plate, tableTop, { width: colWidths.plate });
    doc.text("İstasyon", colX.cp, tableTop, { width: colWidths.cp });
    doc.text("kWh", colX.kwh, tableTop, { width: colWidths.kwh });
    doc.text("Tutar", colX.cost, tableTop, { width: colWidths.cost });

    doc.font(FONT_SANS);

    let y = tableTop + rowHeight;
    for (const row of data.rows) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(formatTrDateTime(row.startTime), colX.date, y, { width: colWidths.date });
      doc.text(row.userName.slice(0, 12), colX.user, y, { width: colWidths.user });
      doc.text(row.numaraTaj, colX.numaraTaj, y, { width: colWidths.numaraTaj });
      doc.text(row.licensePlate || "-", colX.plate, y, { width: colWidths.plate });
      doc.text(row.chargePointId, colX.cp, y, { width: colWidths.cp });
      doc.text(row.kwh.toFixed(2), colX.kwh, y, { width: colWidths.kwh });
      doc.text(`₺${row.cost.toFixed(2)}`, colX.cost, y, { width: colWidths.cost });
      y += rowHeight;
    }

    doc.moveDown(2);
    doc.font(FONT_SANS_BOLD).text(`Genel Toplam: ₺${data.totalCost.toFixed(2)}`);
    doc.text(`Toplam kWh: ${data.totalKwh.toFixed(2)}`);

    doc.end();
  });
}
