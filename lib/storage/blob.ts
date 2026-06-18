import "server-only";

import { del, head, put } from "@vercel/blob";

function blobTokenConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobStorageEnabled() {
  return blobTokenConfigured();
}

export async function putBlobObject(
  pathname: string,
  body: Uint8Array,
  contentType: string,
) {
  if (!blobTokenConfigured()) return null;

  return put(pathname, Buffer.from(body), {
    access: "public",
    addRandomSuffix: false,
    contentType,
  });
}

export async function readBlobObject(pathname: string): Promise<Buffer | null> {
  if (!blobTokenConfigured()) return null;

  try {
    const blob = await head(pathname);
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function blobObjectExists(pathname: string) {
  if (!blobTokenConfigured()) return false;

  try {
    await head(pathname);
    return true;
  } catch {
    return false;
  }
}

export async function deleteBlobObject(pathname: string) {
  if (!blobTokenConfigured()) return;

  try {
    const blob = await head(pathname);
    await del(blob.url);
  } catch {
    // Ignore missing blobs so local and cloud cleanup paths behave the same.
  }
}