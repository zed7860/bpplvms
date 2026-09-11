import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = String(body.phone || "").trim();
    if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: visitor, error: findError } = await supabaseAdmin.from("visitors").select("id").eq("phone", phone).eq("status", "IN").order("check_in", { ascending: false }).limit(1).maybeSingle();
    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
    if (!visitor) return NextResponse.json({ error: "No active entry found for this mobile number." }, { status: 404 });

    const checkOut = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("visitors").update({ check_out: checkOut, status: "OUT" }).eq("id", visitor.id).select("id,name,email,phone,company,visitor_type,purpose,meeting_with_name,photo_url,status,check_in,check_out").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ visitor: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}