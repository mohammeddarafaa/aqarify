import PDFDocument from "pdfkit";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

interface ReceiptData {
  confirmationNumber: string;
  tenantName: string;
  customerName: string;
  unitNumber: string;
  buildingName?: string;
  projectName?: string;
  totalPrice: number;
  amountPaid: number;
  paymentType: string;
  paymentMethod: string;
  transactionId?: string;
  date: string;
}

function formatEGP(amount: number): string {
  return `${amount.toLocaleString("en-EG")} EGP`;
}

export async function generateReceiptPDF(
  data: ReceiptData,
  tenantId: string,
  reservationId: string
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const filePath = `receipts/${tenantId}/${reservationId}-${Date.now()}.pdf`;

        const { error } = await supabaseAdmin.storage
          .from("documents")
          .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

        if (error) {
          logger.error("PDF upload error", error);
          resolve(null);
          return;
        }

        // Private bucket: store path in DB; mint time-limited URLs via GET /reservations/:id/receipt
        resolve(filePath);
      });

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text(data.tenantName, { align: "center" });
      doc.fontSize(14).font("Helvetica").text("Payment Receipt", { align: "center" });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Confirmation
      doc.fontSize(12).font("Helvetica-Bold").text(`Confirmation Number: ${data.confirmationNumber}`);
      doc.fontSize(10).font("Helvetica").text(`Date: ${data.date}`);
      doc.moveDown();

      // Customer & Unit
      const rows = [
        ["Customer Name", data.customerName],
        ["Unit", data.unitNumber + (data.buildingName ? ` - ${data.buildingName}` : "")],
        ["Project", data.projectName ?? "—"],
        ["Total Unit Price", formatEGP(data.totalPrice)],
        ["Payment Type", data.paymentType],
        ["Payment Method", data.paymentMethod],
        ["Amount Paid", formatEGP(data.amountPaid)],
        ...(data.transactionId ? [["Transaction ID", data.transactionId]] : []),
      ];

      rows.forEach(([label, value]) => {
        doc.font("Helvetica-Bold").text(`${label}:`, { continued: true });
        doc.font("Helvetica").text(` ${value}`);
      });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(9).fillColor("#888").text(
        "This is an official payment receipt. Please keep it for your records.",
        { align: "center" }
      );

      doc.end();
    } catch (err) {
      logger.error("PDF generation error", err);
      resolve(null);
    }
  });
}
