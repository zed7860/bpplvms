import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyHostCheckout } from "@/lib/visitor-email";

export async function PATCH(_:Request,{params}:{params:Promise<{id:string}>}) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabaseAdmin = getSupabaseAdmin();
  const {id}=await params;
  const {data,error}=await supabaseAdmin.from("visitors").update({check_out:new Date().toISOString(),status:"OUT"}).eq("id",id).select("id,name,email,phone,company,visitor_type,purpose,meeting_with_id,meeting_with_name,photo_url,status,check_in,check_out").single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  try {
    const { data: host } = await supabaseAdmin.from("employees").select("email").eq("id", data.meeting_with_id).maybeSingle();
    const hostEmail = String(host?.email || "").trim();
    if (hostEmail && /^\S+@\S+\.\S+$/.test(hostEmail)) {
      await notifyHostCheckout({ visitorId:data.id, name:data.name, email:data.email, phone:data.phone, company:data.company, visitorType:data.visitor_type, purpose:data.purpose, hostName:data.meeting_with_name, hostEmail, photoUrl:data.photo_url, checkIn:data.check_in, checkOut:data.check_out });
    }
  } catch { }
  return NextResponse.json(data);
}
