import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CALL_AGENT";
    } & DefaultSession["user"];
  }

  interface JWT {
    role: "ADMIN" | "CALL_AGENT";
    userId: string;
  }
}
