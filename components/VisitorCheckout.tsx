"use client";

import { useState } from "react";
import { formatISTDate, formatISTTime12, formatISTTime24 } from "@/lib/datetime";

type Visitor = { id: string; name: string; email: string | null; phone: string; company: string | null; visitor_type: string; purpose: string | null; meeting_with_name: string; photo_url: string | null; status: string; check_in: string; check_out: string | null };

function timestamp(value: string | null) {
  return value ? `${formatISTDate(value)}, ${formatISTTime12(value)} (${formatISTTime24(value)} IST)` : "Not available";
}

export default function VisitorCheckout() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkOut() {
    setError("");
    if (!/^\d{10}$/.test(phone)) return setError("Please enter your valid 10-digit mobile number.");
    setLoading(true);
    try {
      const response = await fetch("/api/visitors/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to check out.");
      setVisitor(data.visitor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to check out.");
    } finally {
      setLoading(false);
    }
  }

  if (visitor) return <section className="checkout-panel card" aria-labelledby="checkout-complete-title">
    <p className="eyebrow">Visit complete</p><h2 id="checkout-complete-title">You are checked out, {visitor.name}.</h2><p className="question-help">Your visit has been recorded successfully.</p>
    <dl className="checkout-summary"><div><dt>Mobile number</dt><dd>{visitor.phone}</dd></div><div><dt>Email address</dt><dd>{visitor.email || "Not provided"}</dd></div><div><dt>Company / organisation</dt><dd>{visitor.company || "Not provided"}</dd></div><div><dt>Visitor type</dt><dd>{visitor.visitor_type}</dd></div><div><dt>Purpose / remarks</dt><dd>{visitor.purpose || "Not provided"}</dd></div><div><dt>Meeting with</dt><dd>{visitor.meeting_with_name}</dd></div><div><dt>Checked in (IST)</dt><dd>{timestamp(visitor.check_in)}</dd></div><div><dt>Checked out (IST)</dt><dd>{timestamp(visitor.check_out)}</dd></div></dl>
    <button type="button" className="btn primary" onClick={() => window.location.assign("/")}>Home <span>→</span></button>
  </section>;

  return <section className="checkout-panel card" aria-labelledby="checkout-title">
    {!open ? <><p className="eyebrow">Leaving Bhoruka Park?</p><h2 id="checkout-title">Check out</h2><p className="question-help">Record your departure when your visit is complete.</p><button type="button" className="btn secondary" onClick={() => setOpen(true)}>Check out <span>→</span></button></> : <>
      <p className="eyebrow">Check out</p><h2 id="checkout-title">Enter your mobile number</h2><p className="question-help">We will find your active visit and close it.</p>{error && <div className="error" role="alert">{error}</div>}
      <label htmlFor="checkout-phone">Mobile number</label><input id="checkout-phone" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, ""))} placeholder="Enter your 10-digit mobile number" autoFocus />
      <div className="checkout-actions"><button type="button" className="btn secondary" onClick={() => { setOpen(false); setError(""); }}>Back</button><button type="button" className="btn primary" onClick={checkOut} disabled={loading}>{loading ? "Checking…" : "Check out"}</button></div>
    </>}
  </section>;
}