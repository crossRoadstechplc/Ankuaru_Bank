import { PDFDocument, StandardFonts, degrees, rgb, type RGB } from "pdf-lib";

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 44;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export const colors = {
  amber: rgb(0.831, 0.51, 0.039),
  amberDeep: rgb(0.604, 0.294, 0.039),
  amberLight: rgb(0.984, 0.941, 0.863),
  amberMuted: rgb(0.949, 0.878, 0.776),
  amberGlow: rgb(0.992, 0.965, 0.918),
  dark: rgb(0.102, 0.071, 0.031),
  darkBand: rgb(0.133, 0.094, 0.031),
  text: rgb(0.145, 0.125, 0.105),
  muted: rgb(0.416, 0.353, 0.29),
  faint: rgb(0.604, 0.541, 0.478),
  border: rgb(0.91, 0.878, 0.831),
  surface: rgb(0.992, 0.988, 0.976),
  white: rgb(1, 1, 1),
  success: rgb(0.118, 0.451, 0.294),
  successBg: rgb(0.902, 0.969, 0.929),
  warning: rgb(0.604, 0.294, 0.039),
  warningBg: rgb(0.992, 0.941, 0.863),
  watermark: rgb(0.96, 0.945, 0.925),
};

export type PdfFonts = {
  regular: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
};

export type PdfPage = ReturnType<PDFDocument["addPage"]>;

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

export function drawLines(
  page: PdfPage,
  lines: string[],
  x: number,
  startY: number,
  size: number,
  font: PdfFonts["regular"],
  color: RGB = colors.text,
) {
  let y = startY;
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= size + 5;
  }
  return y;
}

function statusPalette(status: string): { bg: RGB; fg: RGB; dot: RGB } {
  const normalized = status.toLowerCase();
  if (normalized === "issued" || normalized === "generated" || normalized === "active") {
    return { bg: colors.successBg, fg: colors.success, dot: colors.success };
  }
  if (normalized === "draft" || normalized === "pending") {
    return { bg: colors.warningBg, fg: colors.warning, dot: colors.warning };
  }
  return { bg: colors.surface, fg: colors.muted, dot: colors.faint };
}

function drawRightText(
  page: PdfPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PdfFonts["regular"],
  color: RGB,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - width, y, size, font, color });
}

function wrapTextByWidth(
  text: string,
  font: PdfFonts["bold"],
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
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
  return lines;
}

function drawStatusBadge(
  page: PdfPage,
  fonts: PdfFonts,
  status: string,
  x: number,
  y: number,
) {
  const statusColors = statusPalette(status);
  const statusLabel = status.toUpperCase();
  const badgeWidth = Math.max(58, fonts.bold.widthOfTextAtSize(statusLabel, 8.5) + 26);
  const badgeHeight = 22;

  page.drawRectangle({
    x,
    y,
    width: badgeWidth,
    height: badgeHeight,
    color: statusColors.bg,
    borderColor: statusColors.fg,
    borderWidth: 0.7,
  });
  page.drawCircle({
    x: x + 11,
    y: y + badgeHeight / 2,
    size: 5,
    color: statusColors.dot,
    borderWidth: 0,
  });
  page.drawText(statusLabel, {
    x: x + 18,
    y: y + 6,
    size: 8.5,
    font: fonts.bold,
    color: statusColors.fg,
  });

  return badgeWidth;
}

function drawShieldIcon(page: PdfPage, cx: number, cy: number, size: number, color: RGB) {
  const h = size * 0.55;
  page.drawLine({ start: { x: cx, y: cy + h }, end: { x: cx - size * 0.42, y: cy + h * 0.35 }, thickness: 1.4, color });
  page.drawLine({ start: { x: cx - size * 0.42, y: cy + h * 0.35 }, end: { x: cx - size * 0.42, y: cy - h * 0.15 }, thickness: 1.4, color });
  page.drawLine({ start: { x: cx - size * 0.42, y: cy - h * 0.15 }, end: { x: cx, y: cy - h * 0.55 }, thickness: 1.4, color });
  page.drawLine({ start: { x: cx, y: cy - h * 0.55 }, end: { x: cx + size * 0.42, y: cy - h * 0.15 }, thickness: 1.4, color });
  page.drawLine({ start: { x: cx + size * 0.42, y: cy - h * 0.15 }, end: { x: cx + size * 0.42, y: cy + h * 0.35 }, thickness: 1.4, color });
  page.drawLine({ start: { x: cx + size * 0.42, y: cy + h * 0.35 }, end: { x: cx, y: cy + h }, thickness: 1.4, color });
  page.drawLine({ start: { x: cx - size * 0.12, y: cy - h * 0.05 }, end: { x: cx - size * 0.02, y: cy - h * 0.22 }, thickness: 1.6, color });
  page.drawLine({ start: { x: cx - size * 0.02, y: cy - h * 0.22 }, end: { x: cx + size * 0.16, y: cy + h * 0.08 }, thickness: 1.6, color });
}

export function drawPageDecorations(page: PdfPage, fonts: PdfFonts, watermark: string) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 200,
    width: PAGE_WIDTH,
    height: 200,
    color: colors.amberGlow,
    borderWidth: 0,
  });

  for (let i = 0; i < 14; i += 1) {
    const offset = i * 38;
    page.drawLine({
      start: { x: offset - 60, y: PAGE_HEIGHT - 90 },
      end: { x: offset + 120, y: PAGE_HEIGHT - 260 },
      thickness: 0.35,
      color: rgb(0.949, 0.91, 0.86),
    });
  }

  page.drawText(watermark, {
    x: PAGE_WIDTH / 2 - fonts.bold.widthOfTextAtSize(watermark, 52) / 2,
    y: PAGE_HEIGHT / 2 - 20,
    size: 52,
    font: fonts.bold,
    color: colors.watermark,
    rotate: degrees(-28),
  });

  const bracket = 18;
  const inset = 28;
  page.drawLine({ start: { x: inset, y: 88 + bracket }, end: { x: inset, y: 88 }, thickness: 1.2, color: colors.amberMuted });
  page.drawLine({ start: { x: inset, y: 88 }, end: { x: inset + bracket, y: 88 }, thickness: 1.2, color: colors.amberMuted });
  page.drawLine({ start: { x: PAGE_WIDTH - inset - bracket, y: 88 }, end: { x: PAGE_WIDTH - inset, y: 88 }, thickness: 1.2, color: colors.amberMuted });
  page.drawLine({ start: { x: PAGE_WIDTH - inset, y: 88 }, end: { x: PAGE_WIDTH - inset, y: 88 + bracket }, thickness: 1.2, color: colors.amberMuted });
}

export function drawDocumentShell(options: {
  page: PdfPage;
  fonts: PdfFonts;
  documentTitle: string;
  documentSubtitle: string;
  referenceLabel: string;
  referenceValue: string;
  status: string;
  bankDisplayName: string;
  watermark?: string;
}) {
  const {
    page,
    fonts,
    documentTitle,
    documentSubtitle,
    referenceLabel,
    referenceValue,
    status,
    bankDisplayName,
    watermark = "ANKUARU",
  } = options;
  const { regular, bold } = fonts;

  drawPageDecorations(page, fonts, watermark);

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 88,
    width: PAGE_WIDTH,
    height: 88,
    color: colors.darkBand,
    borderWidth: 0,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 92,
    width: PAGE_WIDTH,
    height: 4,
    color: colors.amber,
    borderWidth: 0,
  });

  page.drawCircle({
    x: PAGE_WIDTH - 52,
    y: PAGE_HEIGHT - 38,
    size: 64,
    color: rgb(0.18, 0.13, 0.05),
    borderWidth: 0,
  });
  page.drawCircle({
    x: PAGE_WIDTH - 110,
    y: PAGE_HEIGHT - 62,
    size: 36,
    color: rgb(0.16, 0.11, 0.04),
    borderWidth: 0,
  });

  page.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 72,
    width: 36,
    height: 36,
    color: colors.amber,
    borderWidth: 0,
  });
  page.drawText("A", {
    x: MARGIN + 12,
    y: PAGE_HEIGHT - 62,
    size: 20,
    font: bold,
    color: colors.white,
  });

  page.drawText("ANKUARU", {
    x: MARGIN + 46,
    y: PAGE_HEIGHT - 48,
    size: 13,
    font: bold,
    color: colors.white,
  });
  page.drawText("Institutional Trade Finance Platform", {
    x: MARGIN + 46,
    y: PAGE_HEIGHT - 64,
    size: 8,
    font: regular,
    color: rgb(0.82, 0.74, 0.62),
  });

  drawRightText(page, "Issuing Bank", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 64, 8, regular, rgb(0.82, 0.74, 0.62));
  const bankLines = wrapText(bankDisplayName, 32);
  let bankY = PAGE_HEIGHT - 48;
  for (const line of bankLines.slice(0, 2)) {
    drawRightText(page, line, PAGE_WIDTH - MARGIN, bankY, 11, bold, colors.amberLight);
    bankY -= 13;
  }

  const statusLabel = status.toUpperCase();
  const badgeWidth = Math.max(58, bold.widthOfTextAtSize(statusLabel, 8.5) + 26);
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;
  const titleMaxWidth = badgeX - MARGIN - 18;
  const titleSize = documentTitle.length > 18 ? 21 : 24;
  const titleLines = wrapTextByWidth(documentTitle, bold, titleSize, titleMaxWidth).slice(0, 2);
  const titleBaseline = PAGE_HEIGHT - 118;
  const badgeHeight = 22;
  const badgeY = titleBaseline + titleSize - badgeHeight + 1;

  let y = titleBaseline;
  for (const line of titleLines) {
    page.drawText(line, {
      x: MARGIN,
      y,
      size: titleSize,
      font: bold,
      color: colors.dark,
    });
    y -= titleSize + 5;
  }

  drawStatusBadge(page, fonts, status, badgeX, badgeY);

  y -= 6;
  page.drawText(documentSubtitle, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: colors.muted,
    maxWidth: CONTENT_WIDTH,
  });

  y -= 24;
  page.drawRectangle({
    x: MARGIN + 2,
    y: y - 44,
    width: CONTENT_WIDTH,
    height: 52,
    color: rgb(0.93, 0.91, 0.88),
    borderWidth: 0,
  });
  page.drawRectangle({
    x: MARGIN,
    y: y - 44,
    width: CONTENT_WIDTH,
    height: 52,
    color: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: MARGIN,
    y: y - 44,
    width: 6,
    height: 52,
    color: colors.amber,
    borderWidth: 0,
  });

  drawShieldIcon(page, PAGE_WIDTH - MARGIN - 28, y - 18, 28, colors.amberMuted);

  page.drawText(referenceLabel, {
    x: MARGIN + 18,
    y: y - 10,
    size: 7.5,
    font: bold,
    color: colors.muted,
  });
  page.drawText(referenceValue, {
    x: MARGIN + 18,
    y: y - 28,
    size: 14,
    font: bold,
    color: colors.dark,
  });
  page.drawText("Official digital instrument", {
    x: MARGIN + 18,
    y: y - 40,
    size: 7.5,
    font: regular,
    color: colors.faint,
  });

  return y - 60;
}

export function drawMetricRow(
  page: PdfPage,
  fonts: PdfFonts,
  metrics: Array<{ label: string; value: string }>,
  startY: number,
) {
  const count = metrics.length;
  const gap = 10;
  const cardWidth = (CONTENT_WIDTH - gap * (count - 1)) / count;
  let x = MARGIN;
  const cardHeight = 54;
  const y = startY;

  for (const metric of metrics) {
    page.drawRectangle({
      x: x + 1,
      y: y - cardHeight + 1,
      width: cardWidth,
      height: cardHeight,
      color: rgb(0.93, 0.91, 0.88),
      borderWidth: 0,
    });
    page.drawRectangle({
      x: x,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: colors.white,
      borderColor: colors.border,
      borderWidth: 0.8,
    });
    page.drawRectangle({
      x: x,
      y: y - 4,
      width: cardWidth,
      height: 4,
      color: colors.amber,
      borderWidth: 0,
    });
    page.drawText(metric.label.toUpperCase(), {
      x: x + 10,
      y: y - 18,
      size: 7,
      font: fonts.bold,
      color: colors.muted,
    });
    const valueLines = wrapText(metric.value, Math.floor(cardWidth / 6.2));
    drawLines(page, valueLines.slice(0, 2), x + 10, y - 30, 10.5, fonts.bold, colors.dark);
    x += cardWidth + gap;
  }

  return y - cardHeight - 16;
}

export function drawPartyCards(
  page: PdfPage,
  fonts: PdfFonts,
  parties: Array<{ role: string; name: string; detail?: string }>,
  startY: number,
) {
  const gap = 12;
  const cardWidth = (CONTENT_WIDTH - gap * (parties.length - 1)) / parties.length;
  let x = MARGIN;
  const cardHeight = 72;
  const y = startY;

  for (const party of parties) {
    page.drawRectangle({
      x: x + 2,
      y: y - cardHeight + 2,
      width: cardWidth,
      height: cardHeight,
      color: rgb(0.93, 0.91, 0.88),
      borderWidth: 0,
    });
    page.drawRectangle({
      x: x,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: colors.amberGlow,
      borderColor: colors.amberMuted,
      borderWidth: 0.8,
    });
    page.drawText(party.role.toUpperCase(), {
      x: x + 12,
      y: y - 18,
      size: 7,
      font: fonts.bold,
      color: colors.amberDeep,
    });
    const nameLines = wrapText(party.name, Math.floor(cardWidth / 6));
    drawLines(page, nameLines.slice(0, 2), x + 12, y - 34, 10.5, fonts.bold, colors.dark);
    if (party.detail) {
      const detailLines = wrapText(party.detail, Math.floor(cardWidth / 5.5));
      drawLines(page, detailLines.slice(0, 1), x + 12, y - 58, 8, fonts.regular, colors.muted);
    }
    x += cardWidth + gap;
  }

  return y - cardHeight - 18;
}

export function drawSection(
  page: PdfPage,
  fonts: PdfFonts,
  title: string,
  rows: Array<[string, string]>,
  startY: number,
  valueOffset = 150,
) {
  const { regular, bold } = fonts;
  let y = startY;

  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: CONTENT_WIDTH,
    height: 22,
    color: colors.amberLight,
    borderWidth: 0,
  });
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: 4,
    height: 22,
    color: colors.amber,
    borderWidth: 0,
  });
  page.drawText(title.toUpperCase(), {
    x: MARGIN + 14,
    y: y - 1,
    size: 9,
    font: bold,
    color: colors.amberDeep,
  });
  y -= 28;

  const boxTop = y;
  let rowY = y - 10;
  for (let index = 0; index < rows.length; index += 1) {
    const [label, value] = rows[index];
    const valueLines = wrapText(value, 58);
    const rowHeight = Math.max(24, valueLines.length * 15 + 10);

    if (index % 2 === 0) {
      page.drawRectangle({
        x: MARGIN,
        y: rowY - rowHeight + 8,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: colors.surface,
        borderWidth: 0,
      });
    }

    page.drawText(label, {
      x: MARGIN + 12,
      y: rowY - 2,
      size: 9,
      font: bold,
      color: colors.muted,
    });
    rowY = drawLines(page, valueLines, MARGIN + valueOffset, rowY, 10, regular, colors.text) - 4;
  }

  const boxHeight = boxTop - rowY + 6;
  page.drawRectangle({
    x: MARGIN,
    y: rowY - 2,
    width: CONTENT_WIDTH,
    height: boxHeight,
    borderColor: colors.border,
    borderWidth: 0.8,
  });

  return rowY - 20;
}

export function drawHighlightAmount(
  page: PdfPage,
  fonts: PdfFonts,
  label: string,
  amount: string,
  startY: number,
  subtitle?: string,
) {
  const { regular, bold } = fonts;
  const y = startY;
  const boxHeight = subtitle ? 72 : 58;

  page.drawRectangle({
    x: MARGIN + 3,
    y: y - boxHeight + 3,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: rgb(0.88, 0.72, 0.48),
    borderWidth: 0,
  });
  page.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: colors.darkBand,
    borderWidth: 0,
  });
  page.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: 6,
    height: boxHeight,
    color: colors.amber,
    borderWidth: 0,
  });

  page.drawCircle({
    x: PAGE_WIDTH - MARGIN - 36,
    y: y - boxHeight / 2,
    size: 52,
    color: rgb(0.18, 0.13, 0.05),
    borderWidth: 0,
  });
  page.drawCircle({
    x: PAGE_WIDTH - MARGIN - 36,
    y: y - boxHeight / 2,
    size: 52,
    borderColor: colors.amber,
    borderWidth: 1.2,
    color: rgb(0.14, 0.1, 0.03),
  });
  drawShieldIcon(page, PAGE_WIDTH - MARGIN - 36, y - boxHeight / 2, 22, colors.amber);

  page.drawText(label.toUpperCase(), {
    x: MARGIN + 18,
    y: y - 18,
    size: 8,
    font: bold,
    color: rgb(0.82, 0.74, 0.62),
  });
  page.drawText(amount, {
    x: MARGIN + 18,
    y: y - 40,
    size: 24,
    font: bold,
    color: colors.amberLight,
  });
  if (subtitle) {
    page.drawText(subtitle, {
      x: MARGIN + 18,
      y: y - 56,
      size: 8.5,
      font: regular,
      color: rgb(0.72, 0.66, 0.56),
    });
  }

  return y - boxHeight - 16;
}

export function drawDisclaimer(page: PdfPage, fonts: PdfFonts, text: string, startY: number) {
  const lines = wrapText(text, 88);
  const boxHeight = lines.length * 12 + 24;
  const y = startY;

  page.drawRectangle({
    x: MARGIN,
    y: y - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: colors.amberGlow,
    borderColor: colors.amberMuted,
    borderWidth: 0.8,
  });
  page.drawCircle({
    x: MARGIN + 16,
    y: y - 14,
    size: 14,
    color: colors.amberLight,
    borderColor: colors.amber,
    borderWidth: 0.8,
  });
  page.drawText("i", {
    x: MARGIN + 13.5,
    y: y - 18,
    size: 10,
    font: fonts.bold,
    color: colors.amberDeep,
  });

  drawLines(page, lines, MARGIN + 32, y - 14, 8.5, fonts.regular, colors.muted);
  return y - boxHeight - 10;
}

export function drawFooter(page: PdfPage, fonts: PdfFonts, leftText: string, rightText: string) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: 36,
    color: colors.darkBand,
    borderWidth: 0,
  });
  page.drawRectangle({
    x: 0,
    y: 36,
    width: PAGE_WIDTH,
    height: 3,
    color: colors.amber,
    borderWidth: 0,
  });

  const sealX = PAGE_WIDTH - MARGIN - 22;
  page.drawCircle({
    x: sealX,
    y: 78,
    size: 40,
    borderColor: colors.amber,
    borderWidth: 1.2,
    color: colors.amberGlow,
  });
  page.drawCircle({
    x: sealX,
    y: 78,
    size: 30,
    borderColor: colors.amberMuted,
    borderWidth: 0.6,
    color: colors.white,
  });
  page.drawText("DIGITAL", {
    x: sealX - fonts.bold.widthOfTextAtSize("DIGITAL", 5.5) / 2,
    y: 84,
    size: 5.5,
    font: fonts.bold,
    color: colors.amberDeep,
  });
  page.drawText("RECORD", {
    x: sealX - fonts.bold.widthOfTextAtSize("RECORD", 5.5) / 2,
    y: 76,
    size: 5.5,
    font: fonts.bold,
    color: colors.amberDeep,
  });
  drawShieldIcon(page, sealX, 70, 12, colors.amber);

  page.drawLine({
    start: { x: MARGIN, y: 58 },
    end: { x: PAGE_WIDTH - MARGIN - 52, y: 58 },
    thickness: 0.6,
    color: colors.border,
  });
  page.drawText(leftText, {
    x: MARGIN,
    y: 44,
    size: 7.5,
    font: fonts.regular,
    color: colors.faint,
  });
  drawRightText(page, rightText, PAGE_WIDTH - MARGIN - 52, 44, 7.5, fonts.regular, colors.faint);

  page.drawText("ANKUARU", {
    x: MARGIN,
    y: 14,
    size: 8,
    font: fonts.bold,
    color: colors.amber,
  });
  page.drawText("Bank-backed commodity trade finance", {
    x: MARGIN + 52,
    y: 14,
    size: 7.5,
    font: fonts.regular,
    color: rgb(0.72, 0.66, 0.56),
  });
  drawRightText(page, "Demo platform · Not a legal instrument", PAGE_WIDTH - MARGIN, 14, 7, fonts.regular, rgb(0.55, 0.5, 0.44));
}

export async function createPdfPage() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { doc, page, fonts: { regular, bold } };
}
