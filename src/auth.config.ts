import type { NextAuthConfig } from "next-auth";

/**
 * Część konfiguracji NextAuth bez dostawcy Credentials (ten potrzebuje
 * node:crypto z src/lib/password.ts, niedostępnego w Edge Runtime).
 * Używana przez middleware.ts (sprawdzenie roli bez odczytu hasła) i przez
 * pełną konfigurację w src/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "PLAYER";
      }
      return session;
    },
  },
};
