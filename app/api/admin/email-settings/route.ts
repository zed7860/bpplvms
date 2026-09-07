import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createGmailTransport, getGmailSettings, saveGmailSettings, CC_EMAIL } from "@/lib/gmail";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await getGmailSettings();
    return NextResponse.json({ configured: Boolean(settings?.email && settings.app_password_encrypted), email: settings?.email || "", ccEmail: settings?.cc_email || CC_EMAIL, updatedAt: settings?.updated_at || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load email settings." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const appPassword = String(body.appPassword || "").replaceAll(" ", "").trim();
    if (!email || !email.includes("@gmail.com")) return NextResponse.json({ error: "Enter a valid Gmail address." }, { status: 400 });
    if (appPassword.length < 12) return NextResponse.json({ error: "Enter the 16-character Gmail App Password." }, { status: 400 });
    const settings = await saveGmailSettings(email, appPassword);
    return NextResponse.json({ ok: true, configured: true, email: settings.email, ccEmail: settings.cc_email, updatedAt: settings.updated_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save email settings." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const { settings, transporter } = await createGmailTransport();
    const recipient = String(body.recipient || settings.email).trim();
    if (!recipient || !recipient.includes("@")) return NextResponse.json({ error: "Enter a valid test recipient." }, { status: 400 });
    await transporter.sendMail({ from: settings.email, to: recipient, cc: settings.cc_email || CC_EMAIL, subject: "Bhoruka Park email configuration test", text: "Your Bhoruka Park Gmail notification setup is working. IT@bhorukapark.com was included in CC." });
    return NextResponse.json({ ok: true, recipient, ccEmail: settings.cc_email || CC_EMAIL });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send test email." }, { status: 502 });
  }
}
