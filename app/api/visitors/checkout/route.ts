import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyHostCheckout } from "@/lib/visitor-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = String(body.phone || "").trim();
    const rating = Number(body.rating);
    const review = String(body.review || "").trim();
    if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Select a rating from 1 to 5 stars." }, { status: 400 });
    if (review.length > 1000) return NextResponse.json({ error: "Review must be 1000 characters or fewer." }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: visitor, error: findError } = await supabaseAdmin.from("visitors").select("id").eq("phone", phone).eq("status", "IN").order("check_in", { ascending: false }).limit(1).maybeSingle();
    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
    if (!visitor) return NextResponse.json({ error: "No active entry found for this mobile number." }, { status: 404 });

    const checkOut = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("visitors").update({ check_out: checkOut, status: "OUT", feedback_rating: rating, feedback_review: review || null }).eq("id", visitor.id).select("id,name,email,phone,company,visitor_type,purpose,meeting_with_id,meeting_with_name,photo_url,status,check_in,check_out,feedback_rating,feedback_review").single();
    if (error) {
      const missingFeedbackSchema = error.message.includes("feedback_rating") || error.message.includes("feedback_review");
      return NextResponse.json({ error: missingFeedbackSchema ? "Feedback storage is not configured yet. Run supabase/feedback-migration.sql in the Supabase SQL Editor." : error.message }, { status: 500 });
    }
    try {
      const { data: host } = await supabaseAdmin.from("employees").select("email").eq("id", data.meeting_with_id).maybeSingle();
      const hostEmail = String(host?.email || "").trim();
      await notifyHostCheckout({ visitorId:data.id, name:data.name, email:data.email, phone:data.phone, company:data.company, visitorType:data.visitor_type, purpose:data.purpose, hostName:data.meeting_with_name, hostEmail, photoUrl:data.photo_url, checkIn:data.check_in, checkOut:data.check_out, feedbackRating:data.feedback_rating, feedbackReview:data.feedback_review });
    } catch { }
    return NextResponse.json({ visitor: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
