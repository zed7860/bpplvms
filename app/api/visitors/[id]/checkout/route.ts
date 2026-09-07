import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(_:Request,{params}:{params:Promise<{id:string}>}) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabaseAdmin = getSupabaseAdmin();
  const {id}=await params;
  const {data,error}=await supabaseAdmin.from("visitors").update({check_out:new Date().toISOString(),status:"OUT"}).eq("id",id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json(data);
}
