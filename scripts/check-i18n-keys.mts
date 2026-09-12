import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resourcesRoot = path.join(root, "src", "i18n", "resources");
const locales = ["en", "fr", "ar"] as const;

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

function isObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenKeys(
  value: JsonValue,
  prefix = "",
  out: string[] = [],
): string[] {
  if (!isObject(value)) {
    if (prefix) out.push(prefix);
    return out;
  }

  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isObject(child)) {
      flattenKeys(child, next, out);
    } else {
      out.push(next);
    }
  }

  return out;
}

function loadNamespace(locale: string, namespace: string): JsonObject {
  const filePath = path.join(resourcesRoot, locale, `${namespace}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as JsonObject;
}

function listNamespaces(locale: string): string[] {
  const dir = path.join(resourcesRoot, locale);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""))
    .sort();
}

const enNamespaces = listNamespaces("en");
let failed = false;

for (const locale of locales) {
  if (locale === "en") continue;

  const localeNamespaces = new Set(listNamespaces(locale));
  for (const ns of enNamespaces) {
    if (!localeNamespaces.has(ns)) {
      failed = true;
      console.error(`[${locale}] missing namespace file: ${ns}.json`);
      continue;
    }

    const enKeys = new Set(flattenKeys(loadNamespace("en", ns)));
    const localeKeys = new Set(flattenKeys(loadNamespace(locale, ns)));
    const missing = [...enKeys].filter((key) => !localeKeys.has(key)).sort();

    if (missing.length > 0) {
      failed = true;
      console.error(
        `[${locale}] ${ns}: missing ${missing.length} key(s) present in en:`,
      );
      for (const key of missing) {
        console.error(`  - ${key}`);
      }
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `i18n:check passed — fr/ar cover all ${enNamespaces.length} en namespaces`,
);
