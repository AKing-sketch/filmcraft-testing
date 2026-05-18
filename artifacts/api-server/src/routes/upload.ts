import { Router } from "express";
import multer from "multer";
import { inflateRawSync, inflateSync } from "zlib";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require("mammoth");

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword" ||
      /\.(pdf|docx?|gdoc)$/i.test(file.originalname);
    cb(null, ok);
  },
});

// ─── Pure-Node PDF parser (no DOM APIs required) ─────────────────────────────

function parsePdf(buffer: Buffer): { pageCount: number; text: string } {
  const raw = buffer.toString("binary");

  // Page count: find the highest /Count N in the Pages dictionary tree
  let pageCount = 1;
  for (const m of raw.matchAll(/\/Count\s+(\d+)/g)) {
    const n = parseInt(m[1], 10);
    if (n > pageCount) pageCount = n;
  }

  // Text extraction from content streams
  // Strategy 1: uncompressed BT…ET text blocks
  const texts: string[] = [];
  const btEtRe = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;
  while ((btMatch = btEtRe.exec(raw)) !== null) {
    const block = btMatch[1];
    const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|T\*|")/g;
    let sm: RegExpExecArray | null;
    while ((sm = strRe.exec(block)) !== null) {
      const decoded = sm[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\\(\d{3})/g, (_, oct: string) =>
          String.fromCharCode(parseInt(oct, 8))
        );
      if (decoded.trim()) texts.push(decoded);
    }
  }

  // Strategy 2: try to decompress FlateDecode streams for compressed PDFs
  if (texts.length < 20) {
    const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let sm2: RegExpExecArray | null;
    while ((sm2 = streamRe.exec(raw)) !== null) {
      const chunk = sm2[1];
      const binBuf = Buffer.from(chunk, "binary");
      for (const decompress of [inflateSync, inflateRawSync]) {
        try {
          const decompressed = decompress(binBuf).toString("binary");
          const inner = decompressed.matchAll(
            /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|T\*|")/g
          );
          for (const m of inner) {
            if (m[1].trim()) texts.push(m[1]);
          }
          break;
        } catch {
          // not this encoding, try next
        }
      }
      if (texts.length > 2000) break;
    }
  }

  return { pageCount, text: texts.join("\n") };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectType(pages: number): "short" | "feature" | "unknown" {
  if (pages < 4) return "unknown";
  if (pages <= 40) return "short";
  return "feature";
}

function extractTitle(text: string, filename: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);
  for (const line of lines) {
    if (
      line.length >= 3 &&
      line.length <= 80 &&
      line === line.toUpperCase() &&
      !/^(INT\.|EXT\.|INT\/EXT\.|FADE|CUT |PAGE|WRITTEN|DRAFT|WGA|TITLE)/.test(
        line
      ) &&
      !/^\d+\.?\s*$/.test(line)
    ) {
      return line
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    }
  }
  return filename
    .replace(/\.(pdf|docx?|gdoc)$/i, "")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ParsedScene {
  sceneNumber: number;
  intExt: "INT" | "EXT" | "INT/EXT";
  location: string;
  timeOfDay: string;
}

function extractScenes(text: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const re =
    /^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT\.?|EXT\.?|I\/E\.?)\s+([^\n\r]+?)(?:\s*[-–—]\s*(DAY|NIGHT|DUSK|DAWN|CONTINUOUS|LATER|MORNING|EVENING|AFTERNOON|MOMENTS LATER|SAME))?(?:\s*)$/gim;
  let match: RegExpExecArray | null;
  let n = 1;
  while ((match = re.exec(text)) !== null) {
    const raw = match[1].replace(/\./g, "").toUpperCase();
    const intExt: "INT" | "EXT" | "INT/EXT" = raw.includes("/")
      ? "INT/EXT"
      : raw === "INT"
      ? "INT"
      : "EXT";
    const location = (match[2] || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const timeOfDay = (match[3] || "DAY").toUpperCase().trim();
    if (location.length > 1) {
      scenes.push({ sceneNumber: n++, intExt, location, timeOfDay });
      if (n > 150) break;
    }
  }
  return scenes;
}

function extractCharacters(text: string): string[] {
  const found = new Set<string>();
  const skip = new Set([
    "INT","EXT","FADE","CUT","SMASH","DISSOLVE","TITLE","END",
    "ACT","SCENE","THE","WRITTEN","DRAFT","PAGE","CONTINUED",
    "CONT","MORE","OVER","BACK","CLOSE","WIDE","MEDIUM",
  ]);
  for (const line of text.split("\n")) {
    const t = line.trim().replace(/\(.*?\)/g, "").trim();
    if (
      t.length >= 2 &&
      t.length <= 40 &&
      t === t.toUpperCase() &&
      /^[A-Z]/.test(t) &&
      !t.includes(".") &&
      !/\d/.test(t) &&
      !skip.has(t.split(/\s+/)[0])
    ) {
      const words = t.split(/\s+/);
      if (words.length >= 1 && words.length <= 4) found.add(t);
    }
  }
  return Array.from(found).slice(0, 25);
}

// ─── Route ───────────────────────────────────────────────────────────────────

router.post("/script", upload.single("script"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No file received. Please upload a PDF or Word document." });
  }

  const { buffer, originalname, mimetype } = req.file;

  try {
    let text = "";
    let pageCount = 0;

    const isPdf =
      mimetype === "application/pdf" || /\.pdf$/i.test(originalname);

    if (isPdf) {
      const parsed = parsePdf(buffer);
      text = parsed.text;
      pageCount = parsed.pageCount;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value as string;
      // Screenplay format: ~55 words per page
      const words = text.split(/\s+/).filter(Boolean).length;
      pageCount = Math.max(1, Math.round(words / 55));
    }

    const detectedType = detectType(pageCount);
    const title = extractTitle(text, originalname);
    const scenes = extractScenes(text);
    const characters = extractCharacters(text);

    res.json({
      title,
      pageCount,
      detectedType,
      sceneCount: scenes.length,
      characterCount: characters.length,
      scenes,
      characters,
    });
  } catch (err) {
    req.log.error(err);
    res.status(422).json({
      error:
        "Could not parse the file. Make sure it is a valid PDF or Word (.docx) document.",
    });
  }
});

export default router;
