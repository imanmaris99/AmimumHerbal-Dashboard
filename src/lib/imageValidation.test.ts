import assert from "node:assert/strict";
import { test } from "node:test";
import { SMALL_IMAGE_UPLOAD_BYTES, VERCEL_SAFE_UPLOAD_BYTES, validateImageFile } from "./imageValidation.ts";

const imageFile = (size: number) => ({ type: "image/jpeg", size }) as File;

test("uses a 4 MiB product image limit to stay below Vercel's request cap", () => {
  assert.equal(VERCEL_SAFE_UPLOAD_BYTES, 4 * 1024 * 1024);
});

test("accepts image files at the Vercel-safe product upload limit", () => {
  assert.equal(validateImageFile(imageFile(VERCEL_SAFE_UPLOAD_BYTES)), true);
});

test("rejects image files above the Vercel-safe product upload limit", () => {
  assert.equal(validateImageFile(imageFile(VERCEL_SAFE_UPLOAD_BYTES + 1)), false);
});

test("accepts small admin image files at the backend's 300 KB limit", () => {
  assert.equal(validateImageFile(imageFile(SMALL_IMAGE_UPLOAD_BYTES), SMALL_IMAGE_UPLOAD_BYTES, "300KB"), true);
});

test("rejects small admin image files above the backend's 300 KB limit", () => {
  assert.equal(validateImageFile(imageFile(SMALL_IMAGE_UPLOAD_BYTES + 1), SMALL_IMAGE_UPLOAD_BYTES, "300KB"), false);
});