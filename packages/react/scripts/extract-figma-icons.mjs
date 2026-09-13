#!/usr/bin/env node
/**
 * Extract icon symbol names from the Cuboid Figma ❖ Icons page.
 *
 * Requires FIGMA_ACCESS_TOKEN (Personal access token with file read scope).
 *
 *   FIGMA_ACCESS_TOKEN=… npm run icons:extract
 *
 * Writes src/icons/figma-icons.json — input for `npm run icons:sync`.
 */
import fs from "node:fs";
import path from "node:path";
import { parseFigmaMetadataWithCategories } from "./parse-figma-metadata-xml.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_FILE = path.join(ROOT, "src/icons/figma-icons.json");
const METADATA_SNAPSHOT = path.join(ROOT, "scripts/figma-icons.metadata.xml");

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY ?? "zOabpawUgebUI45IulHZUP";
const ICONS_NODE_ID = process.env.FIGMA_ICONS_NODE_ID ?? "12810:80161";

function nodeIdForApi(nodeId) {
  return nodeId.replace("-", ":");
}

async function fetchFigmaNode(nodeId) {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return null;
  }

  const id = encodeURIComponent(nodeIdForApi(nodeId));
  const url = `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${id}`;

  const response = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Figma API ${response.status}: ${body}`);
  }

  return response.json();
}

function walkSymbols(node, category, out) {
  if (!node) return;

  if (node.type === "TEXT" && node.name === "Header" && node.characters) {
    category = node.characters.trim();
  }

  if (node.type === "SYMBOL" || node.type === "COMPONENT") {
    out.push({
      figmaName: node.name.trim(),
      category: category || "Uncategorized",
      figmaNodeId: node.id,
    });
  }

  for (const child of node.children ?? []) {
    walkSymbols(child, category, out);
  }
}

function dedupeIcons(icons) {
  const seen = new Set();
  return icons.filter((icon) => {
    if (seen.has(icon.figmaName)) return false;
    seen.add(icon.figmaName);
    return true;
  });
}

async function main() {
  const payload = await fetchFigmaNode(ICONS_NODE_ID);

  if (!payload) {
    if (fs.existsSync(METADATA_SNAPSHOT)) {
      const xml = fs.readFileSync(METADATA_SNAPSHOT, "utf8");
      const icons = parseFigmaMetadataWithCategories(xml);
      const doc = {
        source: {
          figmaFileKey: FIGMA_FILE_KEY,
          figmaNodeId: ICONS_NODE_ID,
          figmaUrl: `https://www.figma.com/design/${FIGMA_FILE_KEY}/--DS---Cuboid?node-id=${ICONS_NODE_ID.replace(":", "-")}`,
          extractedAt: new Date().toISOString(),
          method: "metadata-snapshot",
        },
        icons: icons.sort((a, b) => a.figmaName.localeCompare(b.figmaName)),
      };
      fs.writeFileSync(OUT_FILE, `${JSON.stringify(doc, null, 2)}\n`);
      console.log(
        `FIGMA_ACCESS_TOKEN not set — parsed snapshot (${icons.length} icons) → ${path.relative(ROOT, OUT_FILE)}`
      );
      return;
    }

    console.log(
      "FIGMA_ACCESS_TOKEN not set and no scripts/figma-icons.metadata.xml snapshot found."
    );
    if (!fs.existsSync(OUT_FILE)) {
      console.error(
        "No figma-icons.json found. Set FIGMA_ACCESS_TOKEN and re-run, or commit a metadata snapshot."
      );
      process.exit(1);
    }
    console.log("Using existing src/icons/figma-icons.json.");
    return;
  }

  const node = payload.nodes?.[nodeIdForApi(ICONS_NODE_ID)]?.document;
  if (!node) {
    throw new Error(`Node ${ICONS_NODE_ID} not found in Figma file ${FIGMA_FILE_KEY}`);
  }

  const icons = dedupeIcons(walkSymbols(node, "", []));

  const doc = {
    source: {
      figmaFileKey: FIGMA_FILE_KEY,
      figmaNodeId: ICONS_NODE_ID,
      figmaUrl: `https://www.figma.com/design/${FIGMA_FILE_KEY}/--DS---Cuboid?node-id=${ICONS_NODE_ID.replace(":", "-")}`,
      extractedAt: new Date().toISOString(),
    },
    icons: icons.sort((a, b) => a.figmaName.localeCompare(b.figmaName)),
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`Wrote ${icons.length} icons → ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
