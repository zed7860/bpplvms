import Link from "next/link";

export default function Home() {
  return (
    <div className="site-shell home-shell">
      <main className="home-grid">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <img className="hero-logo" src="/images/bppl-logo.png" alt="Bhoruka Park logo" />
            <p className="eyebrow">Visitor check-in</p>
            <h1 id="page-title">Welcome to Bhoruka Park</h1>
            <p>Choose an option to continue.</p>
          </div>
        </section>
        <div className="home-actions card">
          <Link className="btn primary" href="/register">Check in <span>→</span></Link>
          <Link className="btn secondary" href="/checkout">Check out <span>→</span></Link>
        </div>
        <p className="privacy-note">Your information is used only to manage today&apos;s visit and is handled securely.</p>
      </main>
    </div>
  );
}
