// Lightweight parser for uploaded documents.
// Text and text-based PDFs are read directly. Images are OCR'd with
// tesseract.js (pure-JS, no native binary needed) so a photographed
// site diagram or scanned letter can still populate facts. If OCR
// fails for any reason (corrupt image, tesseract.js not installed,
// etc.) we fall back to empty text so the UI stays walkable and shows
// the "unclear" messaging instead of crashing.

const fs = require("fs/promises");
const path = require("path");

async function ocrImage(filePath) {
  try {
    // Lazy-required so a missing/broken install only affects image
    // uploads, not the rest of the app.
    const Tesseract = require("tesseract.js");
    const { data } = await Tesseract.recognize(filePath, "eng");
    return data?.text || "";
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[parser] OCR failed, falling back to no extracted text:", err.message);
    return "";
  }
}

async function readText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt" || ext === ".md" || mimeType?.startsWith("text/")) {
    return await fs.readFile(filePath, "utf8");
  }
  if (ext === ".pdf" || mimeType === "application/pdf") {
    // Naive PDF text extraction: pull readable ASCII runs. Good enough for
    // text-based PDFs in a prototype. For scanned/image-only PDFs, this
    // returns little/nothing — wire up OCR on the rendered pages for that case.
    const buf = await fs.readFile(filePath);
    const ascii = buf
      .toString("latin1")
      .replace(/[^\x20-\x7E\n]+/g, " ")
      .replace(/\s{2,}/g, " ");
    return ascii;
  }
  if (mimeType?.startsWith("image/") || [".png", ".jpg", ".jpeg"].includes(ext)) {
    return await ocrImage(filePath);
  }
  return await fs.readFile(filePath, "utf8").catch(() => "");
}

// Pull a handful of likely-fact patterns out of freeform text.
function extractFacts(text) {
  const out = {};
  const grab = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };

  // Numbers with units — try the common ones first.
  const setFront = grab(/front\s*(?:yard\s*)?setback[^0-9]*([0-9.]+)\s*(ft|feet|m)/i);
  if (setFront) out.frontSetback = `${setFront} ft`;
  const setSide = grab(/side\s*(?:yard\s*)?setback[^0-9]*([0-9.]+)\s*(ft|feet|m)/i);
  if (setSide) out.sideSetback = `${setSide} ft`;
  const setRear = grab(/rear\s*(?:yard\s*)?setback[^0-9]*([0-9.]+)\s*(ft|feet|m)/i);
  if (setRear) out.rearSetback = `${setRear} ft`;

  const height = grab(/height[^0-9]*([0-9.]+)\s*(ft|feet|m|stories)/i);
  if (height) out.height = `${height} ft`;

  const far = grab(/FAR[^0-9]*([0-9.]+)/i);
  if (far) out.far = parseFloat(far);

  const area = grab(/(?:lot\s*area|total\s*area|site\s*area)[^0-9]*([0-9,]+)\s*(sq\s*ft|sf|sqft)/i);
  if (area) out.lotArea = `${area.replace(/,/g, "")} sq ft`;

  const parking = grab(/parking[^0-9]*([0-9.]+)\s*(spaces|stalls)/i);
  if (parking) out.parkingSpaces = parseFloat(parking);

  const zone = grab(/zoning[^A-Za-z]*([A-Z]-[0-9]+)/i);
  if (zone) out.zone = zone.toUpperCase();

  const use = grab(/proposed\s*use[:\s]*([A-Za-z][A-Za-z ,/-]{2,60})/i);
  if (use) out.proposedUse = use.replace(/\s+/g, " ").trim();

  const lat = grab(/lat(?:itude)?[^0-9-]*(-?[0-9]+\.[0-9]+)/i);
  if (lat) out.lat = parseFloat(lat);
  const lng = grab(/(?:lng|lon|longitude)[^0-9-]*(-?[0-9]+\.[0-9]+)/i);
  if (lng) out.lng = parseFloat(lng);

  return out;
}

module.exports = { readText, extractFacts };
