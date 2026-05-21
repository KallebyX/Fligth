import { describe, expect, it } from "vitest";
import { NSFW_BLOCK_THRESHOLD } from "@/lib/nsfw/check";

describe("NSFW_BLOCK_THRESHOLD", () => {
  it("is tuned at 0.8 — Google Vision LIKELY / VERY_LIKELY only", () => {
    expect(NSFW_BLOCK_THRESHOLD).toBe(0.8);
  });

  it("VERY_LIKELY (1.0) blocks", () => {
    expect(1.0 >= NSFW_BLOCK_THRESHOLD).toBe(true);
  });

  it("LIKELY (0.8) blocks", () => {
    expect(0.8 >= NSFW_BLOCK_THRESHOLD).toBe(true);
  });

  it("POSSIBLE (0.5) does NOT block — falls to admin moderation", () => {
    expect(0.5 >= NSFW_BLOCK_THRESHOLD).toBe(false);
  });

  it("UNLIKELY (0.25) does NOT block", () => {
    expect(0.25 >= NSFW_BLOCK_THRESHOLD).toBe(false);
  });

  it("VERY_UNLIKELY (0.0) does NOT block", () => {
    expect(0.0 >= NSFW_BLOCK_THRESHOLD).toBe(false);
  });
});
