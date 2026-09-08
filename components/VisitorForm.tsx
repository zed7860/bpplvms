"use client";

import { useEffect, useMemo, useState } from "react";
import { formatISTDate, formatISTTime12, formatISTTime24 } from "@/lib/datetime";

type Employee = { id: string; name: string; department: string | null };
type SubmittedVisitor = { name: string; phone: string; email: string; company: string; visitor_type: string; purpose: string; meeting_with_name: string; photo: string; check_in: string; id?: string };
const steps = ["Mobile", "About you", "Visit", "Host", "Photo"];

function ThankYouScreen({ visitor }: { visitor: SubmittedVisitor }) {
  const details = [["Full name", visitor.name], ["Mobile number", visitor.phone], ["Email address", visitor.email || "Not provided"], ["Company / organisation", visitor.company || "Not provided"], ["Visitor type", visitor.visitor_type], ["Purpose / remarks", visitor.purpose || "Not provided"], ["Meeting with", visitor.meeting_with_name]];

  return <main className="thank-you-screen">
    <section className="thank-you-card" aria-labelledby="thank-you-title">
      <div className="thank-you-heading"><p className="eyebrow">Registration complete</p><h1 id="thank-you-title">Thank you, {visitor.name}.</h1><p>Your visit has been checked in. Please take a seat while your host is notified.</p></div>
      <div className="thank-you-content">
        <div className="thank-you-photo">{visitor.photo ? <img src={visitor.photo} alt={`Photo of ${visitor.name}`} /> : <span aria-hidden="true">{visitor.name.charAt(0).toUpperCase()}</span>}</div>
        <dl className="thank-you-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Checked in (IST)</dt><dd>{formatISTDate(visitor.check_in)}, {formatISTTime12(visitor.check_in)} &middot; {formatISTTime24(visitor.check_in)} (24-hr)</dd></div></dl>
      </div>
      <button type="button" className="btn primary thank-you-close" onClick={() => window.location.assign("/")}>Close and return home <span>→</span></button>
    </section>
  </main>;
}

export default function VisitorForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [submittedVisitor, setSubmittedVisitor] = useState<SubmittedVisitor | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [returningVisitor, setReturningVisitor] = useState(false);
  const [values, setValues] = useState({ name: "", phone: "", email: "", company: "", visitor_type: "Meeting", purpose: "" });

  useEffect(() => {
    fetch("/api/visitors").then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEmployees(data.employees || []);
    }).catch(() => setError("Unable to load the employee list. Please ask reception for assistance."));
  }, []);

  const matches = useMemo(() => {
    const query = employeeQuery.trim().toLowerCase();
    if (query.length < 3 || selectedEmployee) return [];
    return employees.filter(employee => employee.name.toLowerCase().includes(query)).slice(0, 6);
  }, [employeeQuery, employees, selectedEmployee]);

  const update = (field: keyof typeof values, value: string) => setValues(current => ({ ...current, [field]: value }));

  async function checkExistingVisitor(phone: string) {
    setCheckingPhone(true);
    try {
      const response = await fetch(`/api/visitors?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      if (response.ok && data.visitor) {
        setValues(current => ({ ...current, name: data.visitor.name || current.name, email: data.visitor.email || current.email, company: data.visitor.company || current.company }));
        if (data.visitor.photo_url) setPhoto(data.visitor.photo_url);
        setReturningVisitor(true);
      } else {
        setReturningVisitor(false);
      }
    } catch {
      setReturningVisitor(false);
    } finally {
      setCheckingPhone(false);
    }
  }

  function resizePhoto(file: File) {
    const image = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      image.onload = () => {
        const scale = Math.min(1, 900 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return setError("Unable to prepare the selected photo.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.75));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    if (step === 0 && !values.phone.trim()) return "Please enter your mobile number.";
    if (step === 1 && !values.name.trim()) return "Please enter your full name.";
    if (step === 3 && !selectedEmployee) return "Please select the employee you are meeting.";
    if (step === 4 && !photo) return "Please add your photo to continue.";
    return "";
  }

  async function next() {
    const problem = validate();
    if (problem) return setError(problem);
    setError("");
    if (step === 0) await checkExistingVisitor(values.phone.trim());
    setStep(current => Math.min(current + 1, steps.length - 1));
  }

  async function submit() {
    const problem = validate();
    if (problem || !selectedEmployee) return setError(problem || "Please select an employee.");
    setError(""); setLoading(true);
    try {
      const submitted = { ...values, name: values.name.trim(), phone: values.phone.trim(), email: values.email.trim(), company: values.company.trim(), purpose: values.purpose.trim(), meeting_with_id: selectedEmployee.id, meeting_with_name: selectedEmployee.name, photo };
      const response = await fetch("/api/visitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submitted) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed.");
      setSubmittedVisitor({ ...submitted, check_in: new Date().toISOString(), id: data.id });
      setValues({ name: "", phone: "", email: "", company: "", visitor_type: "Meeting", purpose: "" });
      setSelectedEmployee(null); setEmployeeQuery(""); setPhoto(""); setPhotoInputKey(key => key + 1); setStep(0); setReturningVisitor(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration failed.");
    } finally { setLoading(false); }
  }

  if (submittedVisitor) return <ThankYouScreen visitor={submittedVisitor} />;

  return <section className="visitor-flow" role="form" aria-label="Visitor registration">
    <div className="stepper" aria-label={`Step ${step + 1} of ${steps.length}`} aria-live="polite">{steps.map((label, index) => <div className={`stepper-item ${index === step ? "active" : ""} ${index < step ? "complete" : ""}`} key={label} aria-current={index === step ? "step" : undefined}><span>{index < step ? "✓" : index + 1}</span><small>{label}</small></div>)}</div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="question-card">
      {step === 0 && <><p className="eyebrow">Step 1 of 5</p><h2>Let’s start with your mobile number</h2><p className="question-help">We’ll check if we already have your details on file.</p><label htmlFor="visitor-phone">Mobile number</label><input id="visitor-phone" type="tel" value={values.phone} onChange={event => { update("phone", event.target.value); setReturningVisitor(false); }} onKeyDown={event => event.key === "Enter" && next()} placeholder="Enter your mobile number" autoFocus />{checkingPhone && <p className="search-hint">Checking your details…</p>}</>}
      {step === 1 && <><p className="eyebrow">Step 2 of 5</p><h2>{returningVisitor ? `Welcome back, ${values.name.split(" ")[0] || "there"}!` : "What is your name?"}</h2><p className="question-help">{returningVisitor ? "We found your previous details. Please confirm or update them." : "We’ll use this to register your visit."}</p><div className="field-stack"><div><label htmlFor="visitor-name">Full name</label><input id="visitor-name" value={values.name} onChange={event => update("name", event.target.value)} onKeyDown={event => event.key === "Enter" && next()} placeholder="Enter your full name" autoFocus /></div><div><label htmlFor="visitor-email">Email address <span className="optional">Optional</span></label><input id="visitor-email" type="email" value={values.email} onChange={event => update("email", event.target.value)} placeholder="name@example.com" /></div><div><label htmlFor="visitor-company">Company / organisation <span className="optional">Optional</span></label><input id="visitor-company" value={values.company} onChange={event => update("company", event.target.value)} placeholder="Company name" /></div></div></>}
      {step === 2 && <><p className="eyebrow">Step 3 of 5</p><h2>Tell us about your visit</h2><p className="question-help">A few details help us welcome you better.</p><div className="field-stack"><div><label htmlFor="visitor-type">Visitor type</label><select id="visitor-type" value={values.visitor_type} onChange={event => update("visitor_type", event.target.value)}><option>Meeting</option><option>Interview</option><option>Vendor</option><option>Delivery</option><option>Other</option></select></div><div><label htmlFor="visitor-purpose">Purpose / remarks <span className="optional">Optional</span></label><textarea id="visitor-purpose" value={values.purpose} onChange={event => update("purpose", event.target.value)} placeholder="What brings you here today?" /></div></div></>}
      {step === 3 && <><p className="eyebrow">Step 4 of 5</p><h2>Who are you meeting?</h2><p className="question-help">Start typing at least three letters of their name.</p><label htmlFor="employee-search">Employee name</label><div className="employee-search"><input id="employee-search" value={employeeQuery} onChange={event => { setEmployeeQuery(event.target.value); setSelectedEmployee(null); }} onKeyDown={event => event.key === "Enter" && next()} placeholder="For example: Raj" autoComplete="off" autoFocus />{employeeQuery.trim().length > 0 && employeeQuery.trim().length < 3 && <p className="search-hint">Type {3 - employeeQuery.trim().length} more letter{employeeQuery.trim().length === 2 ? "" : "s"} to see matches.</p>}{matches.length > 0 && <ul className="employee-results" role="listbox">{matches.map(employee => <li key={employee.id}><button type="button" role="option" onClick={() => { setSelectedEmployee(employee); setEmployeeQuery(employee.name); }}>{employee.name}<small>{employee.department || "Bhoruka Park"}</small></button></li>)}</ul>}</div>{selectedEmployee && <div className="selected-host" role="status">✓ Meeting with <strong>{selectedEmployee.name}</strong>{selectedEmployee.department ? ` · ${selectedEmployee.department}` : ""}</div>}{employeeQuery.trim().length >= 3 && !selectedEmployee && matches.length === 0 && <p className="search-hint">No matching employee found. Please ask reception for help.</p>}</>}
      {step === 4 && <><p className="eyebrow">Step 5 of 5</p><h2>One last thing — your photo</h2><p className="question-help">This helps our reception team identify your visit.</p><label className="photo-picker" htmlFor="visitor-photo"><span className="photo-icon">◉</span><span>{photo ? "Photo ready — choose another" : "Take or upload your photo"}</span><small>JPG, PNG or camera photo</small><input key={photoInputKey} id="visitor-photo" type="file" accept="image/*" capture="user" onChange={event => event.target.files?.[0] && resizePhoto(event.target.files[0])} /></label>{photo && <img className="visitor-preview" src={photo} alt="Your registration preview" />}</>}
    </div>
    <div className="flow-actions">{step > 0 && <button type="button" className="btn secondary" onClick={() => { setError(""); setStep(current => current - 1); }}>Back</button>}{step < steps.length - 1 ? <button type="button" className="btn primary flow-next" onClick={next}>Continue <span>→</span></button> : <button type="button" className="btn primary flow-next" onClick={submit} disabled={loading || !photo}>{loading ? "Registering…" : "Complete registration"} <span>→</span></button>}</div>
  </section>;
}
