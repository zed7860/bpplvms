import crypto from "crypto";
import nodemailer from "nodemailer";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const SETTINGS_ID = 1;
const CC_EMAIL = "IT@bhorukapark.com";
const algorithm = "aes-256-gcm";

function encryptionKey() {
  return crypto.createHash("sha256").update(process.env.SESSION_SECRET || "development-secret").digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}

function decryptSecret(value: string) {
  const [ivHex, tagHex, encryptedHex] = value.split(":");
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}

export async function getGmailSettings() {
  const { data, error } = await getSupabaseAdmin().from("email_settings").select("id,provider,email,app_password_encrypted,cc_email,updated_at").eq("id", SETTINGS_ID).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveGmailSettings(email: string, appPassword: string) {
  const { data, error } = await getSupabaseAdmin().from("email_settings").upsert({ id: SETTINGS_ID, provider: "gmail", email, app_password_encrypted: encryptSecret(appPassword), cc_email: CC_EMAIL, updated_at: new Date().toISOString() }).select("id,provider,email,cc_email,updated_at").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createGmailTransport() {
  const settings = await getGmailSettings();
  if (!settings?.email || !settings.app_password_encrypted) throw new Error("Gmail email and App Password are not configured.");
  return { settings, transporter: nodemailer.createTransport({ service: "gmail", auth: { user: settings.email, pass: decryptSecret(settings.app_password_encrypted) } }) };
}

export { CC_EMAIL };
