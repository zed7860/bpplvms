import Link from "next/link";

export default function Home() {
  return (
    <div className="site-shell home-shell landing-shell">
      <main className="home-grid">
        <svg className="brand-geometry" viewBox="0 0 280 280" aria-hidden="true">
          <circle cx="140" cy="140" r="112" />
          <circle cx="140" cy="140" r="72" />
          <path d="M20 140h240M140 20v240" />
          <path d="M61 61l158 158M219 61L61 219" />
        </svg>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <img className="hero-logo" src="/images/bhoruka-logo.png" alt="Bhoruka Park Pvt. Limited" />
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
