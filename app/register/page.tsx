import Link from "next/link";
import VisitorForm from "@/components/VisitorForm";

export default function RegisterPage() {
  return <div className="site-shell home-shell"><main className="flow-page"><Link className="back-home" href="/">← Home</Link><div className="card form" id="registration-form"><VisitorForm /></div></main></div>;
}