import Link from "next/link";
import VisitorCheckout from "@/components/VisitorCheckout";

export default function CheckoutPage() {
  return <div className="site-shell home-shell"><main className="flow-page"><Link className="back-home" href="/">← Home</Link><VisitorCheckout /></main></div>;
}