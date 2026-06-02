import { PDFDocument, StandardFonts, rgb, type RGB, type PDFImage } from "pdf-lib";

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 54;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
export const FOOTER_Y = 62;

export const ink = rgb(0.08, 0.08, 0.1);
export const muted = rgb(0.35, 0.35, 0.38);
export const faint = rgb(0.55, 0.55, 0.58);
export const rule = rgb(0.78, 0.78, 0.8);
export const panel = rgb(0.965, 0.965, 0.97);

export type FormalFonts = {
  body: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  mono: Awaited<ReturnType<PDFDocument["embedFont"]>>;
};

export type FormalDoc = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  fonts: FormalFonts;
  y: number;
  pageNum: number;
  bankDisplayName: string;
};

export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function wrapTextWidth(
  text: string,
  font: FormalFonts["body"],
  size: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (lines.length > 0) lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }

  return lines.length ? lines : [""];
}

function drawRight(
  page: FormalDoc["page"],
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: FormalFonts["body"] | FormalFonts["bold"],
  color: RGB,
) {
  page.drawText(text, {
    x: rightX - font.widthOfTextAtSize(text, size),
    y,
    size,
    font,
    color,
  });
}

export async function createFormalDoc(bankDisplayName: string): Promise<FormalDoc> {
  const doc = await PDFDocument.create();
  const fonts: FormalFonts = {
    body: await doc.embedFont(StandardFonts.TimesRoman),
    bold: await doc.embedFont(StandardFonts.TimesRomanBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  };
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { doc, page, fonts, y: PAGE_HEIGHT - MARGIN, pageNum: 1, bankDisplayName };
}

export function drawPageFrame(ctx: FormalDoc) {
  ctx.page.drawRectangle({
    x: MARGIN - 10,
    y: FOOTER_Y + 8,
    width: CONTENT_WIDTH + 20,
    height: PAGE_HEIGHT - MARGIN - FOOTER_Y - 8,
    borderColor: rule,
    borderWidth: 0.8,
  });
  ctx.page.drawRectangle({
    x: MARGIN - 7,
    y: FOOTER_Y + 11,
    width: CONTENT_WIDTH + 14,
    height: PAGE_HEIGHT - MARGIN - FOOTER_Y - 14,
    borderColor: rule,
    borderWidth: 0.4,
  });
}

export function drawPageFooter(ctx: FormalDoc, docRef: string) {
  const { page, fonts, pageNum } = ctx;
  page.drawLine({
    start: { x: MARGIN, y: FOOTER_Y + 4 },
    end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_Y + 4 },
    thickness: 0.5,
    color: rule,
  });
  page.drawText(`Page ${pageNum}`, {
    x: MARGIN,
    y: FOOTER_Y - 10,
    size: 8,
    font: fonts.body,
    color: faint,
  });
  drawRight(page, docRef, PAGE_WIDTH - MARGIN, FOOTER_Y - 10, 8, fonts.mono, faint);
  page.drawText("Digitally issued via ANKUARU Trade Finance Platform", {
    x: PAGE_WIDTH / 2 - fonts.body.widthOfTextAtSize("Digitally issued via ANKUARU Trade Finance Platform", 7) / 2,
    y: FOOTER_Y - 10,
    size: 7,
    font: fonts.body,
    color: faint,
  });
}

export function addPage(ctx: FormalDoc, docRef: string) {
  drawPageFooter(ctx, docRef);
  ctx.pageNum += 1;
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
  drawPageFrame(ctx);
}

export function ensureSpace(ctx: FormalDoc, needed: number, docRef: string) {
  if (ctx.y - needed < FOOTER_Y + 24) addPage(ctx, docRef);
}

export function drawBankLetterhead(
  ctx: FormalDoc,
  options: {
    documentLabel: string;
    referenceNo: string;
    issueDate: string;
    status?: string;
  },
) {
  const { page, fonts, bankDisplayName } = ctx;
  let y = ctx.y;

  page.drawText(bankDisplayName.toUpperCase(), {
    x: MARGIN,
    y,
    size: 13,
    font: fonts.bold,
    color: ink,
  });
  y -= 14;
  page.drawText("Trade Finance & International Banking Division", {
    x: MARGIN,
    y,
    size: 8.5,
    font: fonts.body,
    color: muted,
  });
  y -= 11;
  page.drawText("Addis Ababa, Ethiopia  ·  SWIFT: ABAYETAA  ·  Trade Finance Desk", {
    x: MARGIN,
    y,
    size: 8,
    font: fonts.body,
    color: faint,
  });

  const boxW = 172;
  const boxH = 58;
  const boxX = PAGE_WIDTH - MARGIN - boxW;
  page.drawRectangle({
    x: boxX,
    y: ctx.y - boxH + 4,
    width: boxW,
    height: boxH,
    color: panel,
    borderColor: rule,
    borderWidth: 0.6,
  });
  page.drawText("Document Reference", {
    x: boxX + 8,
    y: ctx.y - 12,
    size: 7,
    font: fonts.bold,
    color: muted,
  });
  page.drawText(options.referenceNo, {
    x: boxX + 8,
    y: ctx.y - 26,
    size: 9.5,
    font: fonts.mono,
    color: ink,
  });
  page.drawText(`Date: ${options.issueDate}`, {
    x: boxX + 8,
    y: ctx.y - 38,
    size: 8,
    font: fonts.body,
    color: muted,
  });
  if (options.status) {
    page.drawText(`Status: ${options.status.toUpperCase()}`, {
      x: boxX + 8,
      y: ctx.y - 50,
      size: 8,
      font: fonts.bold,
      color: ink,
    });
  }

  y -= 24;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: ink,
  });
  y -= 22;

  const titleLines = wrapTextWidth(options.documentLabel, fonts.bold, 13, CONTENT_WIDTH);
  for (const line of titleLines) {
    page.drawText(line, {
      x: PAGE_WIDTH / 2 - fonts.bold.widthOfTextAtSize(line, 13) / 2,
      y,
      size: 13,
      font: fonts.bold,
      color: ink,
    });
    y -= 16;
  }

  y -= 6;
  ctx.y = y;
}

export function drawOpeningParagraph(ctx: FormalDoc, text: string, docRef: string) {
  ensureSpace(ctx, 40, docRef);
  const lines = wrapTextWidth(text, ctx.fonts.body, 9.5, CONTENT_WIDTH);
  for (const line of lines) {
    ensureSpace(ctx, 14, docRef);
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: 9.5, font: ctx.fonts.body, color: ink });
    ctx.y -= 12;
  }
  ctx.y -= 6;
}

export function drawMtField(
  ctx: FormalDoc,
  tag: string,
  label: string,
  value: string,
  docRef: string,
) {
  const valueLines = wrapTextWidth(value, ctx.fonts.body, 9.5, CONTENT_WIDTH - 118);
  const blockHeight = Math.max(28, valueLines.length * 12 + 16);
  ensureSpace(ctx, blockHeight, docRef);

  const y = ctx.y;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: y - blockHeight + 6,
    width: CONTENT_WIDTH,
    height: blockHeight,
    borderColor: rule,
    borderWidth: 0.4,
  });
  ctx.page.drawText(tag, {
    x: MARGIN + 8,
    y: y - 10,
    size: 8.5,
    font: ctx.fonts.mono,
    color: muted,
  });
  ctx.page.drawText(label.toUpperCase(), {
    x: MARGIN + 36,
    y: y - 10,
    size: 7.5,
    font: ctx.fonts.bold,
    color: muted,
  });

  let valueY = y - 22;
  for (const line of valueLines) {
    ctx.page.drawText(line, {
      x: MARGIN + 36,
      y: valueY,
      size: 9.5,
      font: ctx.fonts.body,
      color: ink,
    });
    valueY -= 12;
  }

  ctx.y = y - blockHeight - 4;
}

export function drawClause(
  ctx: FormalDoc,
  number: string,
  title: string,
  paragraphs: string[],
  docRef: string,
) {
  ensureSpace(ctx, 36, docRef);
  ctx.page.drawText(`${number}  ${title}`, {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.y -= 16;

  for (const paragraph of paragraphs) {
    const lines = wrapTextWidth(paragraph, ctx.fonts.body, 9.5, CONTENT_WIDTH - 12);
    for (const line of lines) {
      ensureSpace(ctx, 14, docRef);
      ctx.page.drawText(line, { x: MARGIN + 12, y: ctx.y, size: 9.5, font: ctx.fonts.body, color: ink });
      ctx.y -= 12;
    }
    ctx.y -= 4;
  }
  ctx.y -= 4;
}

export function drawScheduleTable(
  ctx: FormalDoc,
  title: string,
  rows: Array<[string, string]>,
  docRef: string,
) {
  ensureSpace(ctx, 40, docRef);
  ctx.page.drawText(title, {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.y -= 16;

  const labelW = 148;
  for (const [label, value] of rows) {
    const valueLines = wrapTextWidth(value, ctx.fonts.body, 9.5, CONTENT_WIDTH - labelW - 16);
    const rowH = Math.max(22, valueLines.length * 12 + 8);
    ensureSpace(ctx, rowH + 4, docRef);

    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - rowH + 4,
      width: labelW,
      height: rowH,
      color: panel,
      borderColor: rule,
      borderWidth: 0.4,
    });
    ctx.page.drawRectangle({
      x: MARGIN + labelW,
      y: ctx.y - rowH + 4,
      width: CONTENT_WIDTH - labelW,
      height: rowH,
      borderColor: rule,
      borderWidth: 0.4,
    });
    ctx.page.drawText(label, {
      x: MARGIN + 8,
      y: ctx.y - 10,
      size: 8.5,
      font: ctx.fonts.bold,
      color: muted,
    });

    let vy = ctx.y - 10;
    for (const line of valueLines) {
      ctx.page.drawText(line, { x: MARGIN + labelW + 8, y: vy, size: 9.5, font: ctx.fonts.body, color: ink });
      vy -= 12;
    }
    ctx.y -= rowH + 2;
  }
  ctx.y -= 6;
}

export function drawPartyBlock(
  ctx: FormalDoc,
  role: string,
  name: string,
  alias: string,
  docRef: string,
) {
  ensureSpace(ctx, 52, docRef);
  const y = ctx.y;
  ctx.page.drawText(role.toUpperCase(), {
    x: MARGIN,
    y,
    size: 8.5,
    font: ctx.fonts.bold,
    color: muted,
  });
  ctx.page.drawText(name, {
    x: MARGIN,
    y: y - 14,
    size: 10.5,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.page.drawText(`(hereinafter referred to as "${alias}")`, {
    x: MARGIN,
    y: y - 28,
    size: 9,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.page.drawText("a company duly incorporated and validly existing under applicable law.", {
    x: MARGIN,
    y: y - 40,
    size: 9,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.y = y - 54;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export type HumanSignatureSlot = {
  roleLabel: string;
  signerName: string;
  titleLine: string;
  signedAt: string;
  signatureImage: PDFImage;
};

function drawSignatureImage(
  page: FormalDoc["page"],
  image: PDFImage,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, { x, y: y - height, width, height });
  return height;
}

function drawStampImage(
  page: FormalDoc["page"],
  image: PDFImage,
  x: number,
  y: number,
  maxSize: number,
) {
  const scale = maxSize / Math.max(image.width, image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, { x, y: y - height, width, height });
  return { width, height };
}

export function drawBankVerifierAttestation(
  ctx: FormalDoc,
  bankDisplayName: string,
  verifiedAt: string,
  stampImage: PDFImage,
  pagingRef: string,
) {
  ensureSpace(ctx, 96, pagingRef);
  ctx.y -= 8;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: rule,
  });
  ctx.y -= 18;
  ctx.page.drawText("BANK VERIFIER ATTESTATION", {
    x: MARGIN,
    y: ctx.y,
    size: 9,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.y -= 14;

  const blockTop = ctx.y;
  const stampMax = 78;
  const stampX = PAGE_WIDTH - MARGIN - stampMax;
  const { height: stampH } = drawStampImage(ctx.page, stampImage, stampX, blockTop, stampMax);

  ctx.page.drawText("Verified and authenticated by:", {
    x: MARGIN,
    y: blockTop,
    size: 8.5,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.page.drawText(bankDisplayName, {
    x: MARGIN,
    y: blockTop - 14,
    size: 10,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.page.drawText("Trade Finance & Credit Verification Unit", {
    x: MARGIN,
    y: blockTop - 28,
    size: 8,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.page.drawText(`Verified on: ${formatDate(verifiedAt)}`, {
    x: MARGIN,
    y: blockTop - 42,
    size: 8,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.page.drawText("Document reviewed for compliance, KYC, and credit approval.", {
    x: MARGIN,
    y: blockTop - 56,
    size: 7.5,
    font: ctx.fonts.body,
    color: faint,
  });

  ctx.page.drawText("Official verifier stamp", {
    x: stampX + stampMax / 2 - ctx.fonts.body.widthOfTextAtSize("Official verifier stamp", 6.5) / 2,
    y: blockTop - stampH - 10,
    size: 6.5,
    font: ctx.fonts.body,
    color: faint,
  });

  ctx.y = blockTop - Math.max(stampH + 18, 68);
}

function drawSingleHumanSignature(
  ctx: FormalDoc,
  slot: HumanSignatureSlot,
  x: number,
  y: number,
  width: number,
) {
  const { page, fonts } = ctx;
  const sigMaxW = Math.min(width - 16, 130);
  const sigMaxH = 38;

  page.drawText(slot.roleLabel, {
    x,
    y,
    size: 8.5,
    font: fonts.body,
    color: muted,
  });

  const sigHeight = drawSignatureImage(page, slot.signatureImage, x, y - 10, sigMaxW, sigMaxH);

  const lineY = y - 14 - sigHeight;
  page.drawLine({
    start: { x, y: lineY },
    end: { x: x + width - 12, y: lineY },
    thickness: 0.5,
    color: ink,
  });

  page.drawText(slot.signerName, {
    x,
    y: lineY - 14,
    size: 9.5,
    font: fonts.bold,
    color: ink,
  });
  page.drawText(slot.titleLine, {
    x,
    y: lineY - 26,
    size: 8,
    font: fonts.body,
    color: muted,
  });
  page.drawText(`Date: ${formatDate(slot.signedAt)}`, {
    x,
    y: lineY - 38,
    size: 7.5,
    font: fonts.body,
    color: faint,
  });

  return 58 + sigHeight;
}

export function drawHumanSignatureBlocks(
  ctx: FormalDoc,
  slots: HumanSignatureSlot[],
  docRef: string,
) {
  const gap = 16;
  const cols = slots.length > 2 ? 2 : slots.length;
  const colW = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
  const blockH = 108;
  const rows = Math.ceil(slots.length / cols);
  const totalHeight = rows * blockH + (rows - 1) * 8 + 24;

  ensureSpace(ctx, totalHeight, docRef);
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: rule,
  });
  ctx.y -= 18;
  ctx.page.drawText("EXECUTION — SIGNATURES", {
    x: MARGIN,
    y: ctx.y,
    size: 9,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.y -= 16;

  slots.forEach((slot, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    if (row > 0 && col === 0) ensureSpace(ctx, blockH + 8, docRef);
    const x = MARGIN + col * (colW + gap);
    const y = ctx.y - row * (blockH + 8);
    drawSingleHumanSignature(ctx, slot, x, y, colW);
  });

  ctx.y -= rows * blockH + (rows - 1) * 8 + 4;
}

export function drawBankAuthBlock(
  ctx: FormalDoc,
  bankDisplayName: string,
  docRef: string,
  signedAt: string,
  signatureImage: PDFImage,
  verifierStamp: PDFImage,
  signatoryName: string,
) {
  ensureSpace(ctx, 130, docRef);
  ctx.y -= 4;
  ctx.page.drawText("For and on behalf of the Issuing Bank:", {
    x: MARGIN,
    y: ctx.y,
    size: 8.5,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.y -= 14;

  const sigTop = ctx.y;
  const sigHeight = drawSignatureImage(
    ctx.page,
    signatureImage,
    MARGIN,
    ctx.y,
    140,
    42,
  );
  ctx.y -= sigHeight + 4;

  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + 220, y: ctx.y },
    thickness: 0.5,
    color: ink,
  });
  ctx.y -= 14;
  ctx.page.drawText(signatoryName, {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.y -= 12;
  ctx.page.drawText("Authorized Signatory — Trade Finance Department", {
    x: MARGIN,
    y: ctx.y,
    size: 8,
    font: ctx.fonts.body,
    color: muted,
  });
  ctx.y -= 12;
  ctx.page.drawText(bankDisplayName, {
    x: MARGIN,
    y: ctx.y,
    size: 8.5,
    font: ctx.fonts.bold,
    color: ink,
  });
  ctx.y -= 12;
  ctx.page.drawText(`Date: ${formatDate(signedAt)}`, {
    x: MARGIN,
    y: ctx.y,
    size: 7.5,
    font: ctx.fonts.body,
    color: faint,
  });

  const stampMax = 82;
  const stampX = PAGE_WIDTH - MARGIN - stampMax;
  const stampY = sigTop + 6;
  drawStampImage(ctx.page, verifierStamp, stampX, stampY, stampMax);
  ctx.page.drawText("Bank verifier stamp", {
    x: stampX + stampMax / 2 - ctx.fonts.body.widthOfTextAtSize("Bank verifier stamp", 6.5) / 2,
    y: stampY - stampMax - 8,
    size: 6.5,
    font: ctx.fonts.body,
    color: faint,
  });

  ctx.y -= 20;
}
