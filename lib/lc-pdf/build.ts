import type { LetterOfCreditRecord } from "@/lib/bank-operations-db";
import type { BankPdfContext } from "@/lib/bank-pdf-assets-client";
import {
  createFormalDoc,
  drawBankAuthBlock,
  drawBankLetterhead,
  drawMtField,
  drawOpeningParagraph,
  drawPageFooter,
  drawPageFrame,
  formatDate,
} from "@/lib/pdf/formal-layout";
import { loadBankDocumentImages } from "@/lib/pdf/signatures";

function formatLcTypeLabel(type: LetterOfCreditRecord["lcType"]) {
  switch (type) {
    case "sight":
      return "IRREVOCABLE DOCUMENTARY CREDIT — AT SIGHT";
    case "usance":
      return "IRREVOCABLE DOCUMENTARY CREDIT — USANCE";
    case "bond":
      return "PERFORMANCE BOND / STANDBY LETTER OF CREDIT";
    case "blocked":
      return "BLOCKED FUNDS GUARANTEE";
  }
}

function lcAvailability(type: LetterOfCreditRecord["lcType"]) {
  switch (type) {
    case "sight":
      return "BY PAYMENT";
    case "usance":
      return "BY ACCEPTANCE";
    case "bond":
      return "BY PAYMENT UPON CLAIM";
    case "blocked":
      return "BY BLOCKED DEPOSIT CONFIRMATION";
  }
}

function documentsRequired(commodityHint: string) {
  return [
    "1. Signed commercial invoice in 3 originals.",
    "2. Full set (3/3) of clean on board ocean bills of lading made out to order of issuing bank, marked freight prepaid, notify applicant.",
    "3. Packing list in 3 copies.",
    "4. Certificate of origin issued by Chamber of Commerce.",
    "5. Quality and weight certificate issued by independent surveyor.",
    `6. Warehouse receipt evidencing storage of ${commodityHint || "the goods"}.`,
    "7. Insurance policy/certificate for 110% of invoice value covering ICC(A).",
  ].join("\n");
}

export async function buildLcPdf(
  lc: LetterOfCreditRecord,
  bank: BankPdfContext,
): Promise<Uint8Array> {
  const ctx = await createFormalDoc(bank.bankDisplayName);
  const images = await loadBankDocumentImages(ctx.doc, bank.bankId, bank.pdfAssets);
  const docRef = lc.lcUid;
  const issueDate = formatDate(lc.updatedAt);
  const lcTitle = formatLcTypeLabel(lc.lcType);
  const expiryPlace = "Addis Ababa, Ethiopia";

  drawPageFrame(ctx);
  drawBankLetterhead(ctx, {
    documentLabel: lcTitle,
    referenceNo: docRef,
    issueDate,
    status: lc.status,
  });

  drawOpeningParagraph(
    ctx,
    `We, ${bank.bankDisplayName}, hereby issue our irrevocable documentary credit in favour of the beneficiary named below, ` +
      `subject to the Uniform Customs and Practice for Documentary Credits (UCP 600, 2007 Revision, ICC Publication No. 600) ` +
      `and the following terms and conditions. This credit is available for negotiation/payment strictly against presentation of complying documents.`,
    docRef,
  );

  drawMtField(ctx, "20", "Documentary Credit Number", lc.lcUid, docRef);
  drawMtField(ctx, "31C", "Date of Issue", issueDate, docRef);
  drawMtField(ctx, "40A", "Form of Documentary Credit", "IRREVOCABLE", docRef);
  drawMtField(ctx, "31D", "Date and Place of Expiry", `${lc.expiryDate || "As stated"} at ${expiryPlace}`, docRef);
  drawMtField(ctx, "50", "Applicant", lc.applicant, docRef);
  drawMtField(ctx, "59", "Beneficiary", lc.beneficiary, docRef);
  drawMtField(
    ctx,
    "32B",
    "Currency Code, Amount",
    `${lc.amount} (in words: amount as stated above)`,
    docRef,
  );
  drawMtField(
    ctx,
    "41A",
    "Available With... By...",
    `${bank.bankDisplayName} BY ${lcAvailability(lc.lcType)}`,
    docRef,
  );
  drawMtField(
    ctx,
    "42C",
    "Drafts at...",
    lc.lcType === "usance" ? "90 DAYS AFTER SIGHT OF COMPLYING DOCUMENTS" : "SIGHT",
    docRef,
  );
  drawMtField(ctx, "43P", "Partial Shipments", "NOT ALLOWED", docRef);
  drawMtField(ctx, "43T", "Transhipment", "ALLOWED", docRef);
  drawMtField(ctx, "44E", "Port of Loading / Airport of Departure", "DJIBOUTI, REPUBLIC OF DJIBOUTI", docRef);
  drawMtField(ctx, "44F", "Port of Discharge / Airport of Destination", "AS PER APPLICANT INSTRUCTION", docRef);
  drawMtField(
    ctx,
    "45A",
    "Description of Goods and/or Services",
    lc.contractUid
      ? `Commodity trade pursuant to Contract Ref. ${lc.contractUid}. Goods as per proforma invoice and contract specifications. Ethiopian origin commodity for export.`
      : "Commodity goods as per proforma invoice and contract specifications attached hereto.",
    docRef,
  );
  drawMtField(ctx, "46A", "Documents Required", documentsRequired("goods"), docRef);
  drawMtField(
    ctx,
    "47A",
    "Additional Conditions",
    [
      "All documents must be issued in English.",
      "Documents dated prior to LC issuance date are not acceptable.",
      `Collateral reference: ${lc.collateralReference || "As per bank records"}.`,
      `Template: ${lc.pdfTemplate}.`,
      "Third-party documents acceptable except invoice.",
      "Charter party bills of lading not acceptable.",
    ].join("\n"),
    docRef,
  );
  drawMtField(
    ctx,
    "71B",
    "Charges",
    "All banking charges outside Ethiopia are for account of beneficiary unless otherwise stated. Issuing bank charges for applicant's account.",
    docRef,
  );
  drawMtField(
    ctx,
    "48",
    "Period for Presentation",
    "Documents must be presented within 21 days after the date of shipment but within the validity of the credit.",
    docRef,
  );
  drawMtField(
    ctx,
    "49",
    "Confirmation Instructions",
    "WITHOUT CONFIRMATION",
    docRef,
  );
  drawMtField(
    ctx,
    "78",
    "Instructions to Paying/Accepting/Negotiating Bank",
    "Upon receipt of documents which appear on their face to be in compliance with the terms of this credit, " +
      "you are authorized to effect payment to the beneficiary and to claim reimbursement from us.",
    docRef,
  );

  drawOpeningParagraph(
    ctx,
    "This documentary credit is subject to the ICC Uniform Rules for Documentary Credits (UCP 600). " +
      "The issuing bank undertakes to honour drafts and/or documents presented in compliance with the terms herein. " +
      "This message constitutes the operative instrument and bears the authorized signature of the issuing bank below.",
    docRef,
  );

  drawBankAuthBlock(
    ctx,
    bank.bankDisplayName,
    docRef,
    lc.updatedAt,
    images.bankSignature,
    images.verifierStamp,
    bank.signatoryName,
  );
  drawPageFooter(ctx, docRef);

  return ctx.doc.save();
}
