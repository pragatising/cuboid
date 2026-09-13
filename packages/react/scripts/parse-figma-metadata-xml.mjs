#!/usr/bin/env node
/**
 * Parse Figma get_metadata XML into figma-icons.json structure.
 * Used for offline bootstrap when FIGMA_ACCESS_TOKEN is unavailable.
 */
import fs from "node:fs";
import path from "node:path";

export function parseFigmaMetadataXml(xml) {
  const icons = [];
  let category = "Uncategorized";

  const lines = xml.split("\n");
  for (const line of lines) {
    const headerMatch = line.match(/<text[^>]*name="Header"[^>]*\/>/);
    if (headerMatch) {
      continue;
    }

    const headerTextMatch = line.match(/<text[^>]*name="Header"[^>]*x="[^"]*"[^>]*\/>/);
    if (headerTextMatch) continue;

    const categoryMatch = line.match(/<text[^>]*name="Header"[^>]*>.*?characters[^>]*>([^<]+)/);
    if (categoryMatch) {
      category = categoryMatch[1].trim();
    }

    const symbolMatch = line.match(/<symbol[^>]*name="([^"]+)"[^>]*id="([^"]+)"/);
    if (symbolMatch) {
      icons.push({
        figmaName: symbolMatch[1],
        category,
        figmaNodeId: symbolMatch[2],
      });
    }
  }

  const seen = new Set();
  return icons.filter((icon) => {
    if (seen.has(icon.figmaName)) return false;
    seen.add(icon.figmaName);
    return true;
  });
}

export function parseFigmaMetadataWithCategories(xml) {
  const icons = [];
  let category = "Uncategorized";

  for (const line of xml.split("\n")) {
    if (line.includes('name="Header"') && line.includes("<text")) {
      const chars = line.match(/characters="([^"]+)"/);
      if (chars) category = chars[1].trim();
    }

    const symbolMatch = line.match(/<symbol[^>]*id="([^"]+)"[^>]*name="([^"]+)"/);
    if (!symbolMatch) continue;

    icons.push({
      figmaName: symbolMatch[2],
      category,
      figmaNodeId: symbolMatch[1],
    });
  }

  const seen = new Set();
  return icons.filter((icon) => {
    if (seen.has(icon.figmaName)) return false;
    seen.add(icon.figmaName);
    return true;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inFile = process.argv[2];
  const outFile =
    process.argv[3] ?? path.resolve(import.meta.dirname, "../src/icons/figma-icons.json");

  const xml = fs.readFileSync(inFile, "utf8");
  const icons = parseFigmaMetadataWithCategories(xml);

  const doc = {
    source: {
      figmaFileKey: "zOabpawUgebUI45IulHZUP",
      figmaNodeId: "12810:80161",
      figmaUrl:
        "https://www.figma.com/design/zOabpawUgebUI45IulHZUP/--DS---Cuboid?node-id=12810-80161",
      extractedAt: new Date().toISOString(),
      method: "metadata-xml",
    },
    icons: icons.sort((a, b) => a.figmaName.localeCompare(b.figmaName)),
  };

  fs.writeFileSync(outFile, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`Wrote ${icons.length} icons → ${outFile}`);
}
