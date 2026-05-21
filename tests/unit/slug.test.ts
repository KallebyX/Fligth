import { describe, expect, it } from "vitest";
import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("lowercases", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(toSlug("São Paulo")).toBe("sao-paulo");
    expect(toSlug("Aeroclube do Rio Grande do Sul")).toBe(
      "aeroclube-do-rio-grande-do-sul",
    );
    expect(toSlug("Bragança Paulista")).toBe("braganca-paulista");
    expect(toSlug("José")).toBe("jose");
  });

  it("collapses runs of non-alphanumerics", () => {
    expect(toSlug("ACAS — Santos!!")).toBe("acas-santos");
    expect(toSlug("a@@@b")).toBe("a-b");
  });

  it("trims leading/trailing dashes", () => {
    expect(toSlug("  café  ")).toBe("cafe");
    expect(toSlug("---test---")).toBe("test");
  });

  it("respects maxLength", () => {
    const long = "a".repeat(200);
    expect(toSlug(long).length).toBe(80);
    expect(toSlug(long, 10).length).toBe(10);
  });

  it("returns empty string for empty input", () => {
    expect(toSlug("")).toBe("");
    expect(toSlug("   ")).toBe("");
  });

  it("handles emoji + non-Latin scripts", () => {
    expect(toSlug("Olá 🚀 mundo")).toBe("ola-mundo");
    expect(toSlug("Aço de qualidade")).toBe("aco-de-qualidade");
  });
});
