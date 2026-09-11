import { createGmailTransport, parseCcEmails } from "@/lib/gmail";
import { formatISTDateTime } from "@/lib/datetime";

type VisitorEmailInput = {
  visitorId: string;
  name: string;
  email: string | null;
  phone: string;
  company: string | null;
  visitorType: string;
  purpose: string | null;
  hostName: string;
  hostEmail: string;
  photoUrl: string | null;
  checkIn: string;
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "Not provided")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function notifyHost(input: VisitorEmailInput) {
  const { settings, transporter } = await createGmailTransport();

  const checkInIST = formatISTDateTime(input.checkIn);
  const rows = [
    ["Visitor", input.name],
    ["Email", input.email],
    ["Phone", input.phone],
    ["Company", input.company],
    ["Visitor type", input.visitorType],
    ["Purpose", input.purpose],
    ["Checked in", checkInIST],
    ["Visitor ID", input.visitorId],
  ].map(([label, value]) => `<tr><th style="padding:8px 18px 8px 0;text-align:left;color:#66777b;font-size:12px">${label}</th><td style="padding:8px 0;color:#17324a">${escapeHtml(value)}</td></tr>`).join("");

  const photo = input.photoUrl ? `<p><strong>Visitor photo</strong></p><p><a href="${escapeHtml(input.photoUrl)}">Open visitor photo</a></p>` : "";
  const html = `<div style="font-family:Arial,sans-serif;color:#17324a"><h2>New visitor arrival</h2><p>${escapeHtml(input.name)} has arrived to meet you at Bhoruka Park.</p><table>${rows}</table>${photo}<p style="margin-top:24px;color:#66777b;font-size:12px">This notification was sent by the Bhoruka Park visitor management system.</p></div>`;
  const text = `New visitor arrival\n\n${input.name} has arrived to meet you at Bhoruka Park.\n\nVisitor: ${input.name}\nEmail: ${input.email || "Not provided"}\nPhone: ${input.phone}\nCompany: ${input.company || "Not provided"}\nVisitor type: ${input.visitorType}\nPurpose: ${input.purpose || "Not provided"}\nChecked in: ${checkInIST}\nVisitor ID: ${input.visitorId}\nPhoto: ${input.photoUrl || "Not available"}`;

  const hostEmail = input.hostEmail.trim().toLowerCase();
  const ccEmails = parseCcEmails(settings.cc_email).map(email => email.toLowerCase()).filter(email => email !== hostEmail);
  await transporter.sendMail({ from: settings.email, to: [hostEmail], cc: ccEmails.length ? ccEmails : undefined, subject: `Visitor arrived: ${input.name}`, html, text });
}

export async function notifyHostCheckout(input: VisitorEmailInput & { checkOut: string }) {
  const { settings, transporter } = await createGmailTransport();

  const checkInIST = formatISTDateTime(input.checkIn);
  const checkOutIST = formatISTDateTime(input.checkOut);
  const rows = [
    ["Visitor", input.name],
    ["Email", input.email],
    ["Phone", input.phone],
    ["Company", input.company],
    ["Visitor type", input.visitorType],
    ["Purpose", input.purpose],
    ["Start time (Checked in)", checkInIST],
    ["End time (Checked out)", checkOutIST],
    ["Visitor ID", input.visitorId],
  ].map(([label, value]) => `<tr><th style="padding:8px 18px 8px 0;text-align:left;color:#66777b;font-size:12px">${label}</th><td style="padding:8px 0;color:#17324a">${escapeHtml(value)}</td></tr>`).join("");

  const photo = input.photoUrl ? `<p><strong>Visitor photo</strong></p><p><a href="${escapeHtml(input.photoUrl)}">Open visitor photo</a></p>` : "";
  const html = `<div style="font-family:Arial,sans-serif;color:#17324a"><h2>Visitor checked out</h2><p>${escapeHtml(input.name)}'s visit to Bhoruka Park has ended.</p><table>${rows}</table>${photo}<p style="margin-top:24px;color:#66777b;font-size:12px">This notification was sent by the Bhoruka Park visitor management system.</p></div>`;
  const text = `Visitor checked out\n\n${input.name}'s visit to Bhoruka Park has ended.\n\nVisitor: ${input.name}\nEmail: ${input.email || "Not provided"}\nPhone: ${input.phone}\nCompany: ${input.company || "Not provided"}\nVisitor type: ${input.visitorType}\nPurpose: ${input.purpose || "Not provided"}\nStart time (Checked in): ${checkInIST}\nEnd time (Checked out): ${checkOutIST}\nVisitor ID: ${input.visitorId}\nPhoto: ${input.photoUrl || "Not available"}`;

  const hostEmail = input.hostEmail.trim().toLowerCase();
  const ccEmails = parseCcEmails(settings.cc_email).map(email => email.toLowerCase()).filter(email => email !== hostEmail);
  await transporter.sendMail({ from: settings.email, to: [hostEmail], cc: ccEmails.length ? ccEmails : undefined, subject: `Visitor checked out: ${input.name}`, html, text });
}
