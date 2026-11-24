// main.ts — One-Line Robot Wedding Vows entry.
// Reads the vow from VOW.txt, runs it through a table of gate checks
// (UTF-8, 1-160 characters, one line, not whitespace-only, no control
// characters, no leading/trailing spaces), writes it to /output/entry.txt,
// then reads it back and compares the bytes.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? ".";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
const MAX_CHARS = 160;

type Check = { name: string; ok: (vow: string) => boolean; why: string };

const CHECKS: Check[] = [
  { name: "length", ok: (v) => v.length >= 1 && v.length <= MAX_CHARS, why: "vow must be 1-160 characters" },
  { name: "not-blank", ok: (v) => v.trim().length > 0, why: "vow must not be whitespace only" },
  { name: "single-line", ok: (v) => !v.includes("\n") && !v.includes("\r"), why: "vow must be a single line" },
  { name: "no-control", ok: (v) => ![...v].some((c) => c.charCodeAt(0) < 0x20), why: "vow must not contain control characters" },
  { name: "no-edge-spaces", ok: (v) => v === v.trim(), why: "vow must not start or end with a space" },
  { name: "has-promise", ok: (v) => ["take", "vow", "promise", "till", "will"].some((w) => v.toLowerCase().includes(w)), why: "vow must carry a promise or commitment" },
  { name: "ends-cleanly", ok: (v) => /[.!?]$/.test(v), why: "vow must end with terminal punctuation" },
];

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function readVow(): string {
  let raw: string;
  try {
    raw = readFileSync(join(botDir, "VOW.txt"), "utf-8");
  } catch {
    fail("cannot read VOW.txt");
  }
  // Tolerate a single trailing newline in the source file.
  const vow = raw!.endsWith("\n") ? raw!.slice(0, -1) : raw!;
  return vow;
}

function sealVow(vow: string): string {
  const failed = CHECKS.filter((c) => !c.ok(vow));
  if (failed.length > 0) {
    fail(`vow failed checks: ${failed.map((c) => `${c.name} (${c.why})`).join(", ")}`);
  }
  return vow;
}

function publishVow(vow: string): void {
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "entry.txt");
  writeFileSync(target, vow, "utf-8");
  const back = readFileSync(target, "utf-8");
  if (back !== vow) {
    fail("read-back mismatch: entry.txt differs from the vow");
  }
  console.log(`wrote ${vow.length} characters to ${target}`);
}

const vow = sealVow(readVow());
publishVow(vow);
