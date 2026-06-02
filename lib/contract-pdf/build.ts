import type { TradeContractRecord } from "@/lib/bank-operations-db";
import type { BankPdfContext } from "@/lib/bank-pdf-assets-client";
import {
  createFormalDoc,
  drawBankLetterhead,
  drawBankVerifierAttestation,
  drawClause,
  drawHumanSignatureBlocks,
  drawOpeningParagraph,
  drawPageFooter,
  drawPageFrame,
  drawPartyBlock,
  drawScheduleTable,
  formatDate,
} from "@/lib/pdf/formal-layout";
import { loadBankDocumentImages } from "@/lib/pdf/signatures";

export async function buildContractPdf(
  contract: TradeContractRecord,
  bank: BankPdfContext,
): Promise<Uint8Array> {
  const ctx = await createFormalDoc(bank.bankDisplayName);
  const images = await loadBankDocumentImages(ctx.doc, bank.bankId, bank.pdfAssets);
  const docRef = contract.contractUid;
  const contractDate = formatDate(contract.updatedAt);
  const quantity = contract.quantity || "As per Schedule A";
  const price = contract.price || "As per Schedule A";
  const contractType = contract.contractType || "Standard commodity sale and purchase agreement";

  drawPageFrame(ctx);
  drawBankLetterhead(ctx, {
    documentLabel: "COMMODITY SALE AND PURCHASE AGREEMENT (BANK-BACKED)",
    referenceNo: docRef,
    issueDate: contractDate,
    status: contract.status,
  });

  drawOpeningParagraph(
    ctx,
    `This Sale and Purchase Agreement ("Agreement") is entered into on ${contractDate} by and between the parties identified below, ` +
      `in connection with a bank-backed commodity trade facilitated through ${bank.bankDisplayName} and the ANKUARU trade finance platform.`,
    docRef,
  );

  drawPartyBlock(ctx, "The Buyer", contract.buyer, "Buyer", docRef);
  drawPartyBlock(ctx, "The Seller", contract.seller, "Seller", docRef);

  drawOpeningParagraph(
    ctx,
    `WHEREAS the Seller is engaged in the production and/or export of ${contract.commodity}; and WHEREAS the Buyer wishes to purchase ` +
      `such goods on the terms set forth herein; and WHEREAS payment and/or performance under this Agreement is supported by a bank guarantee ` +
      `or documentary credit issued by ${bank.bankDisplayName}${contract.guaranteeLcUid ? ` (Ref. ${contract.guaranteeLcUid})` : ""}; ` +
      `NOW, THEREFORE, the parties agree as follows:`,
    docRef,
  );

  drawClause(ctx, "1.", "Subject Matter and Specifications", [
    `The Seller agrees to sell and the Buyer agrees to purchase ${contract.commodity} in accordance with the specifications, quantity, and quality standards set out in Schedule A hereto.`,
    `Contract type: ${contractType}.`,
  ], docRef);

  drawClause(ctx, "2.", "Quantity and Price", [
    `Quantity: ${quantity}.`,
    `Price: ${price}.`,
    "The price shall be firm unless otherwise agreed in writing by both parties and confirmed by the issuing bank where applicable.",
  ], docRef);

  drawClause(ctx, "3.", "Delivery and Shipment", [
    "Delivery shall be effected FOB Djibouti (Incoterms® 2020) unless otherwise specified in Schedule A.",
    "Shipment period shall be as agreed between the parties and notified through the ANKUARU platform.",
    "Partial shipments and transhipment shall be as permitted under the linked bank instrument.",
  ], docRef);

  drawClause(ctx, "4.", "Payment and Bank Backing", [
    `Payment shall be effected in accordance with the terms of the Letter of Credit or bank guarantee referenced as ${contract.guaranteeLcUid || "to be issued"} issued by ${bank.bankDisplayName}.`,
    "The Buyer shall open and maintain the bank instrument in good standing until full settlement of the transaction.",
    "Neither party shall alter payment terms without written consent of the issuing bank.",
  ], docRef);

  drawClause(ctx, "5.", "Documents and Settlement Trigger", [
    `Settlement shall be triggered upon: ${contract.settlementTrigger || "presentation of complying documents and confirmation of delivery"}.`,
    "Required documents shall include commercial invoice, bill of lading, packing list, certificate of origin, and warehouse receipt as specified under the linked LC.",
  ], docRef);

  drawClause(ctx, "6.", "Quality, Inspection and Claims", [
    "Quality shall conform to the grade and specifications in Schedule A. Independent surveyor certificates shall be final and binding unless manifest error.",
    "Claims for quality or quantity must be notified within 7 days of arrival at destination port.",
  ], docRef);

  drawClause(ctx, "7.", "Force Majeure", [
    "Neither party shall be liable for failure to perform due to events beyond reasonable control, including export restrictions, port closures, or acts of government.",
  ], docRef);

  drawClause(ctx, "8.", "Governing Law and Dispute Resolution", [
    "This Agreement shall be governed by the laws of the Federal Democratic Republic of Ethiopia.",
    "Disputes shall first be resolved by negotiation; failing agreement, by arbitration under the rules of the Addis Ababa Chamber of Commerce.",
  ], docRef);

  drawScheduleTable(ctx, "SCHEDULE A — COMMODITY PARTICULARS", [
    ["Contract Reference", docRef],
    ["Commodity", contract.commodity],
    ["Quantity", quantity],
    ["Price / Basis", price],
    ["Contract Type", contractType],
    ["Issuing Bank", bank.bankDisplayName],
    ["Linked LC / Guarantee", contract.guaranteeLcUid || "Not yet linked"],
    ["Settlement Trigger", contract.settlementTrigger || "Per bank policy"],
  ], docRef);

  drawOpeningParagraph(
    ctx,
    "IN WITNESS WHEREOF, the parties have caused this Agreement to be signed by their duly authorized representatives on the date first written above.",
    docRef,
  );

  drawHumanSignatureBlocks(
    ctx,
    [
      {
        roleLabel: "For and on behalf of the Buyer:",
        signerName: contract.buyer,
        titleLine: "Authorized Signatory — Buyer",
        signedAt: contract.updatedAt,
        signatureImage: images.buyerSignature,
      },
      {
        roleLabel: "For and on behalf of the Seller:",
        signerName: contract.seller,
        titleLine: "Authorized Signatory — Seller",
        signedAt: contract.updatedAt,
        signatureImage: images.sellerSignature,
      },
      {
        roleLabel: "Witness for the Issuing Bank:",
        signerName: bank.signatoryName,
        titleLine: `Trade Finance Officer — ${bank.bankDisplayName}`,
        signedAt: contract.updatedAt,
        signatureImage: images.bankSignature,
      },
    ],
    docRef,
  );

  drawBankVerifierAttestation(
    ctx,
    bank.bankDisplayName,
    contract.updatedAt,
    images.verifierStamp,
    docRef,
  );
  drawPageFooter(ctx, docRef);

  return ctx.doc.save();
}
