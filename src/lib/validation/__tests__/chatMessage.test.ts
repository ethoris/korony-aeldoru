import { describe, expect, it } from "vitest";

import { containsLink, validateChatMessage } from "../chatMessage";

describe("chatMessage", () => {
  it("wykrywa linki http(s) i www", () => {
    expect(containsLink("zobacz http://example.com")).toBe(true);
    expect(containsLink("zobacz www.example.com")).toBe(true);
    expect(containsLink("zwykła wiadomość")).toBe(false);
  });

  it("odrzuca pustą wiadomość", () => {
    expect(validateChatMessage("   ", true).ok).toBe(false);
  });

  it("odrzuca wiadomość dłuższą niż 300 znaków", () => {
    expect(validateChatMessage("a".repeat(301), true).ok).toBe(false);
    expect(validateChatMessage("a".repeat(300), true).ok).toBe(true);
  });

  it("blokuje linki poza kanałem gildii", () => {
    expect(validateChatMessage("http://spam.pl", false).ok).toBe(false);
    expect(validateChatMessage("http://spam.pl", true).ok).toBe(true);
  });

  it("blokuje wulgaryzmy", () => {
    expect(validateChatMessage("ty kurwo", true).ok).toBe(false);
  });
});
