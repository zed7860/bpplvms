"use client";

import { useState } from "react";
import { formatISTDate, formatISTTime12, formatISTTime24 } from "@/lib/datetime";

type Visitor = { id: string; name: string; email: string | null; phone: string; company: string | null; visitor_type: string; purpose: string | null; meeting_with_name: string; photo_url: string | null; status: string; check_in: string; check_out: string | null; feedback_rating: number | null; feedback_review: string | null };

function timestamp(value: string | null) {
  return value ? `${formatISTDate(value)}, ${formatISTTime12(value)} (${formatISTTime24(value)} IST)` : "Not available";
}

export default function VisitorCheckout() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"phone" | "feedback">("phone");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");

  async function checkOut() {
    setError("");
    if (!/^\d{10}$/.test(phone)) return setError("Please enter your valid 10-digit mobile number.");
    setLoading(true);
    try {
      if (!rating) return setError("Please select a star rating before checking out.");
      const response = await fetch("/api/visitors/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, rating, review: review.trim() }) });
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
    <dl className="checkout-summary"><div><dt>Mobile number</dt><dd>{visitor.phone}</dd></div><div><dt>Email address</dt><dd>{visitor.email || "Not provided"}</dd></div><div><dt>Company / organisation</dt><dd>{visitor.company || "Not provided"}</dd></div><div><dt>Visitor type</dt><dd>{visitor.visitor_type}</dd></div><div><dt>Purpose / remarks</dt><dd>{visitor.purpose || "Not provided"}</dd></div><div><dt>Meeting with</dt><dd>{visitor.meeting_with_name}</dd></div><div><dt>Checked in (IST)</dt><dd>{timestamp(visitor.check_in)}</dd></div><div><dt>Checked out (IST)</dt><dd>{timestamp(visitor.check_out)}</dd></div><div><dt>Your rating</dt><dd className="feedback-stars-summary">{"★".repeat(visitor.feedback_rating || 0)}{"☆".repeat(5 - (visitor.feedback_rating || 0))} <span>{visitor.feedback_rating}/5</span></dd></div>{visitor.feedback_review && <div><dt>Your review</dt><dd>{visitor.feedback_review}</dd></div>}</dl>
    <button type="button" className="btn primary" onClick={() => window.location.assign("/")}>Home <span>→</span></button>
  </section>;

  return <section className="checkout-panel card" aria-labelledby="checkout-title">
    {!open ? <><p className="eyebrow">Leaving Bhoruka Park?</p><h2 id="checkout-title">Check out</h2><p className="question-help">Record your departure and share a quick rating.</p><button type="button" className="btn secondary" onClick={() => setOpen(true)}>Check out <span>→</span></button></> : <>
      {stage === "phone" ? <><p className="eyebrow">Check out · Step 1 of 2</p><h2 id="checkout-title">Enter your mobile number</h2><p className="question-help">We’ll use this to find your active visit.</p>{error && <div className="error" role="alert">{error}</div>}<label htmlFor="checkout-phone">Mobile number</label><input id="checkout-phone" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={event => { setPhone(event.target.value.replace(/\D/g, "")); setError(""); }} placeholder="Enter your 10-digit mobile number" autoComplete="off" autoFocus /><div className="checkout-actions"><button type="button" className="btn secondary" onClick={() => { setOpen(false); setError(""); }}>Back</button><button type="button" className="btn primary" onClick={() => { if (!/^\d{10}$/.test(phone)) return setError("Please enter your valid 10-digit mobile number."); setError(""); setStage("feedback"); }}>Continue <span>→</span></button></div></> : <><p className="eyebrow">Check out · Step 2 of 2</p><h2 id="checkout-title">How was your visit?</h2><p className="question-help">Select a rating. A written review is optional.</p>{error && <div className="error" role="alert">{error}</div>}<fieldset className="rating-fieldset"><legend>Rate your experience</legend><div className="star-rating" role="radiogroup" aria-label="Visit rating">{[1,2,3,4,5].map(star => <button key={star} type="button" role="radio" aria-checked={rating === star} aria-label={`${star} star${star === 1 ? "" : "s"}`} className={star <= (hoveredRating || rating) ? "selected" : ""} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} onFocus={() => setHoveredRating(star)} onBlur={() => setHoveredRating(0)} onClick={() => { setRating(star); setError(""); }}>★</button>)}</div><p className="rating-label" aria-live="polite">{rating ? `${rating} out of 5 stars` : "Choose 1 to 5 stars"}</p></fieldset><label htmlFor="checkout-review">Review <span className="optional">Optional</span></label><textarea id="checkout-review" value={review} maxLength={1000} onChange={event => setReview(event.target.value)} placeholder="Tell us what went well or what we can improve…" autoComplete="off" spellCheck={false} /><div className="review-count">{review.length}/1000</div><div className="checkout-actions"><button type="button" className="btn secondary" onClick={() => { setStage("phone"); setError(""); }}>Back</button><button type="button" className="btn primary" onClick={checkOut} disabled={loading}>{loading ? "Completing…" : "Submit feedback & check out"}</button></div></>}
    </>}
  </section>;
}
