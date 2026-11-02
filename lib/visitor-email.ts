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

function validEmail(value: string | null | undefined) {
  const email = String(value || "").trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : "";
}

function emailCard(title: string, intro: string, rows: string, footer: string) {
  return `<div style="margin:0;padding:32px 14px;background:#f5f3ec;font-family:Arial,sans-serif;color:#14251f"><div style="max-width:640px;margin:auto;overflow:hidden;border:1px solid #ded9cc;border-radius:22px;background:#ffffff;box-shadow:0 14px 38px rgba(20,37,31,.10)"><div style="padding:24px 30px;background:#173d32;color:#ffffff"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d6bd91">Bhoruka Park</div><h1 style="margin:8px 0 0;font-size:27px;line-height:1.2">${escapeHtml(title)}</h1></div><div style="padding:28px 30px"><p style="margin:0 0 22px;color:#56645e;line-height:1.7">${intro}</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #ece8df;color:#7b857f;font-size:12px;line-height:1.6">${escapeHtml(footer)}</p></div></div></div>`;
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
  const html = emailCard("New visitor arrival", `${escapeHtml(input.name)} has arrived to meet you at Bhoruka Park.${photo}`, rows, "This notification was sent by the Bhoruka Park visitor management system.");
  const text = `New visitor arrival\n\n${input.name} has arrived to meet you at Bhoruka Park.\n\nVisitor: ${input.name}\nEmail: ${input.email || "Not provided"}\nPhone: ${input.phone}\nCompany: ${input.company || "Not provided"}\nVisitor type: ${input.visitorType}\nPurpose: ${input.purpose || "Not provided"}\nChecked in: ${checkInIST}\nVisitor ID: ${input.visitorId}\nPhoto: ${input.photoUrl || "Not available"}`;

  const hostEmail = input.hostEmail.trim().toLowerCase();
  const ccEmails = parseCcEmails(settings.cc_email).map(email => email.toLowerCase()).filter(email => email !== hostEmail);
  await transporter.sendMail({ from: settings.email, to: [hostEmail], cc: ccEmails.length ? ccEmails : undefined, subject: `Visitor arrived: ${input.name}`, html, text });

  const visitorEmail = validEmail(input.email);
  if (visitorEmail) {
    const visitorRows = [
      ["Visitor", input.name],
      ["Meeting with", input.hostName],
      ["Checked in", checkInIST],
      ["Visitor ID", input.visitorId],
    ].map(([label, value]) => `<tr><th style="padding:8px 18px 8px 0;text-align:left;color:#66777b;font-size:12px">${label}</th><td style="padding:8px 0;color:#17324a">${escapeHtml(value)}</td></tr>`).join("");
    const visitorHtml = emailCard("Welcome to Bhoruka Park", `Hello ${escapeHtml(input.name)}, your visit has been checked in successfully. You came to meet <strong>${escapeHtml(input.hostName)}</strong>.`, visitorRows, "This confirmation was sent by the Bhoruka Park visitor management system.");
    const visitorText = `Welcome to Bhoruka Park\n\nHello ${input.name}, your visit has been checked in successfully.\nYou came to meet ${input.hostName}.\n\nChecked in: ${checkInIST}\nVisitor ID: ${input.visitorId}`;
    await transporter.sendMail({ from: settings.email, to: [visitorEmail], subject: `Checked in at Bhoruka Park – meeting ${input.hostName}`, html: visitorHtml, text: visitorText });
  }
}

export async function notifyHostCheckout(input: VisitorEmailInput & { checkOut: string; feedbackRating?: number | null; feedbackReview?: string | null }) {
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
    ["Experience rating", input.feedbackRating ? `${input.feedbackRating}/5 stars` : "Not provided"],
    ["Visitor review", input.feedbackReview || "Not provided"],
    ["Visitor ID", input.visitorId],
  ].map(([label, value]) => `<tr><th style="padding:8px 18px 8px 0;text-align:left;color:#66777b;font-size:12px">${label}</th><td style="padding:8px 0;color:#17324a">${escapeHtml(value)}</td></tr>`).join("");

  const photo = input.photoUrl ? `<p><strong>Visitor photo</strong></p><p><a href="${escapeHtml(input.photoUrl)}">Open visitor photo</a></p>` : "";
  const html = emailCard("Visitor checked out", `${escapeHtml(input.name)}'s visit to Bhoruka Park has ended.${photo}`, rows, "This notification was sent by the Bhoruka Park visitor management system.");
  const text = `Visitor checked out\n\n${input.name}'s visit to Bhoruka Park has ended.\n\nVisitor: ${input.name}\nEmail: ${input.email || "Not provided"}\nPhone: ${input.phone}\nCompany: ${input.company || "Not provided"}\nVisitor type: ${input.visitorType}\nPurpose: ${input.purpose || "Not provided"}\nStart time (Checked in): ${checkInIST}\nEnd time (Checked out): ${checkOutIST}\nExperience rating: ${input.feedbackRating ? `${input.feedbackRating}/5 stars` : "Not provided"}\nVisitor review: ${input.feedbackReview || "Not provided"}\nVisitor ID: ${input.visitorId}\nPhoto: ${input.photoUrl || "Not available"}`;

  const hostEmail = validEmail(input.hostEmail);
  if (hostEmail) {
    const ccEmails = parseCcEmails(settings.cc_email).map(email => email.toLowerCase()).filter(email => email !== hostEmail);
    await transporter.sendMail({ from: settings.email, to: [hostEmail], cc: ccEmails.length ? ccEmails : undefined, subject: `Visitor checked out: ${input.name}`, html, text });
  }

  const visitorEmail = validEmail(input.email);
  if (visitorEmail) {
    const visitorRows = [
      ["Visitor", input.name],
      ["Met with", input.hostName],
      ["Checked in", checkInIST],
      ["Checked out", checkOutIST],
      ["Your rating", input.feedbackRating ? `${input.feedbackRating}/5 stars` : "Not provided"],
      ["Your review", input.feedbackReview || "Not provided"],
      ["Visitor ID", input.visitorId],
    ].map(([label, value]) => `<tr><th style="padding:8px 18px 8px 0;text-align:left;color:#66777b;font-size:12px">${label}</th><td style="padding:8px 0;color:#17324a">${escapeHtml(value)}</td></tr>`).join("");
    const visitorHtml = emailCard("Your visit is complete", `Hello ${escapeHtml(input.name)}, you have been checked out successfully. Your meeting with <strong>${escapeHtml(input.hostName)}</strong> is recorded below.`, visitorRows, "Thank you for visiting Bhoruka Park. We appreciate your feedback.");
    const visitorText = `Your Bhoruka Park visit is complete\n\nHello ${input.name}, you have been checked out successfully.\nYou met with ${input.hostName}.\n\nChecked in: ${checkInIST}\nChecked out: ${checkOutIST}\nYour rating: ${input.feedbackRating ? `${input.feedbackRating}/5 stars` : "Not provided"}\nYour review: ${input.feedbackReview || "Not provided"}\nVisitor ID: ${input.visitorId}\n\nThank you for visiting Bhoruka Park.`;
    await transporter.sendMail({ from: settings.email, to: [visitorEmail], subject: `Checked out from Bhoruka Park – visit with ${input.hostName}`, html: visitorHtml, text: visitorText });
  }
}
