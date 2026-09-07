import VisitorForm from "@/components/VisitorForm";

export default function Home() {
  return (
    <div className="site-shell">
      <main className="container">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Visitor check-in</p>
            <h1 id="page-title">Welcome to Bhoruka Park</h1>
            <p>Register your visit in a few simple steps. Your host will be notified when you arrive.</p>
          </div>
        </section>
        <div className="card form" id="registration-form">
          <VisitorForm />
        </div>
        <p className="privacy-note">Your information is used only to manage today&apos;s visit and is handled securely.</p>
      </main>
    </div>
  );
}
