"use client";
import { useState } from "react";

export default function Login() {
  const [error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const password = String(new FormData(e.currentTarget).get("password"));
    const r = await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
    if(r.ok) location.href="/admin"; else setError("Invalid admin password.");
  }
  return <main className="container" style={{maxWidth:480,marginTop:70}}>
    <div className="card">
      <img className="login-logo" src="/images/bppl-logo.png" alt="Bhoruka Park logo" />
      <h2>Bhoruka Park Admin</h2><p className="muted">Sign in to manage visitors and employees.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit} className="grid">
        <div><label>Admin Password</label><input type="password" name="password" required /></div>
        <button className="btn primary">Sign In</button>
      </form>
    </div>
  </main>;
}
