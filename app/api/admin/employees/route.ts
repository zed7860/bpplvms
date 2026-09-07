import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabaseAdmin = getSupabaseAdmin();
  const {data,error}=await supabaseAdmin.from("employees").select("*").order("name");
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({employees:data});
}
export async function POST(req:NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabaseAdmin = getSupabaseAdmin();
  const b=await req.json();
  if(!b.name) return NextResponse.json({error:"Name required"},{status:400});
  const {data,error}=await supabaseAdmin.from("employees").insert({name:b.name,department:b.department||null,email:b.email||null,active:true}).select().single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
export async function PATCH(req:NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabaseAdmin = getSupabaseAdmin();
  const b=await req.json();
  const {data,error}=await supabaseAdmin.from("employees").update({name:b.name,department:b.department||null,email:b.email||null,active:b.active}).eq("id",b.id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
