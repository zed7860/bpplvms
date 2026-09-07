import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "bhoruka_admin";
const secret = () => process.env.SESSION_SECRET || "development-secret";

export function makeSession(): string {
  const payload = `admin.${Date.now() + 1000 * 60 * 60 * 12}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function validSession(value?: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  const exp = Number(parts[1]);
  return parts[0] === "admin" && crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected)) && Date.now() < exp;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return validSession(store.get(COOKIE)?.value);
}

export { COOKIE };
