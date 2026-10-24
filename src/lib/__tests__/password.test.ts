import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../password";

describe("hashPassword / verifyPassword", () => {
  it("poprawne hasło weryfikuje się zgodnie z haszem", async () => {
    const hash = await hashPassword("super-tajne-haslo");
    await expect(verifyPassword("super-tajne-haslo", hash)).resolves.toBe(true);
  });

  it("niepoprawne hasło nie przechodzi weryfikacji", async () => {
    const hash = await hashPassword("super-tajne-haslo");
    await expect(verifyPassword("zle-haslo", hash)).resolves.toBe(false);
  });

  it("ten sam hasło daje różne hasze (losowa sól)", async () => {
    const a = await hashPassword("powtarzalne-haslo");
    const b = await hashPassword("powtarzalne-haslo");
    expect(a).not.toBe(b);
  });

  it("hasz nie jest samym hasłem w czystym tekście", async () => {
    const hash = await hashPassword("tajne123");
    expect(hash).not.toContain("tajne123");
  });

  it("odrzuca pusty lub uszkodzony hasz bez wyjątku", async () => {
    await expect(verifyPassword("cokolwiek", "")).resolves.toBe(false);
    await expect(verifyPassword("cokolwiek", "bez-dwukropka")).resolves.toBe(false);
  });
});
