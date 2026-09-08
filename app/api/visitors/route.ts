import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyHost } from "@/lib/visitor-email";

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (phone) {
    const { data, error } = await supabaseAdmin.from("visitors").select("name,email,company,photo_url").eq("phone", phone).order("check_in", { ascending: false }).limit(1).maybeSingle();
    if (error) return NextResponse.json({error:error.message}, {status:500});
    return NextResponse.json({visitor: data || null});
  }
  const { data, error } = await supabaseAdmin.from("employees").select("id,name,department").eq("active", true).order("name");
  if (error) return NextResponse.json({error:error.message}, {status:500});
  return NextResponse.json({employees:data});
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const required = ["name","phone","meeting_with_id","meeting_with_name"];
    for (const k of required) if (!body[k]) return NextResponse.json({error:`${k} is required.`},{status:400});
    const { data: host, error: hostError } = await supabaseAdmin.from("employees").select("id,name,email,active").eq("id", body.meeting_with_id).eq("active", true).single();
    if (hostError || !host) return NextResponse.json({error:"The selected host is no longer available."},{status:400});
    const hostEmail = String(host.email || "").trim();
    if (!hostEmail || !/^\S+@\S+\.\S+$/.test(hostEmail)) return NextResponse.json({error:`${host.name} does not have a valid email address configured. Update this employee in Admin → Employees.`},{status:400});
    let photo_url = null;
    if (body.photo) {
      if (/^https?:\/\//.test(body.photo)) {
        photo_url = body.photo;
      } else {
        const base64 = String(body.photo).split(",")[1];
        const bytes = Buffer.from(base64, "base64");
        const path = `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const up = await supabaseAdmin.storage.from("visitor-photos").upload(path, bytes, {contentType:"image/jpeg", upsert:false});
        if (up.error) return NextResponse.json({error:"Photo upload failed: " + up.error.message},{status:500});
        const pub = supabaseAdmin.storage.from("visitor-photos").getPublicUrl(path);
        photo_url = pub.data.publicUrl;
      }
    }
      const checkIn = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("visitors").insert({
      name: body.name, email: body.email || null, phone: body.phone,
      company: body.company || null, visitor_type: body.visitor_type || "Other",
      photo_url, meeting_with_id: host.id, meeting_with_name: host.name,
        purpose: body.purpose || null, status:"IN", check_in: checkIn
    }).select("id").single();
    if (error) return NextResponse.json({error:error.message},{status:500});
    try {
        await notifyHost({ visitorId:data.id, name:body.name, email:body.email || null, phone:body.phone, company:body.company || null, visitorType:body.visitor_type || "Other", purpose:body.purpose || null, hostName:host.name, hostEmail, photoUrl:photo_url, checkIn });
    } catch (notificationError) {
      return NextResponse.json({error:notificationError instanceof Error ? notificationError.message : "Host notification failed."},{status:502});
    }
      return NextResponse.json({ok:true,id:data.id,check_in:checkIn});
  } catch { return NextResponse.json({error:"Invalid request."},{status:400}); }
}
