import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFromDir } from "./copyFromDir.ts";

test("copies every file from source into a newly created destination", async () => {
  const root = await mkdtemp(join(tmpdir(), "copy-from-dir-"));
  const source = join(root, "source");
  const destination = join(root, "nested", "destination");

  try {
    await mkdir(source, { recursive: true });
    await writeFile(join(source, "a.txt"), "a-content");
    await writeFile(join(source, "b.txt"), "b-content");

    const copied = await copyFromDir(source, destination);

    assert.deepEqual(copied.sort(), ["a.txt", "b.txt"]);
    assert.equal(await readFile(join(destination, "a.txt"), "utf8"), "a-content");
    assert.equal(await readFile(join(destination, "b.txt"), "utf8"), "b-content");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("strips a trailing slash from source and destination paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "copy-from-dir-"));
  const source = join(root, "source");
  const destination = join(root, "destination");

  try {
    await mkdir(source, { recursive: true });
    await writeFile(join(source, "a.txt"), "content");

    await copyFromDir(`${source}/`, `${destination}/`);

    assert.equal(await readFile(join(destination, "a.txt"), "utf8"), "content");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
