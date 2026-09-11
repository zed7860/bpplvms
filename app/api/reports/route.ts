import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { istDateBoundary } from "@/lib/datetime";

export async function GET(req:NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabaseAdmin = getSupabaseAdmin();
  const url=new URL(req.url);
  const from=url.searchParams.get("from"); const to=url.searchParams.get("to");
  if(!from || !to) return NextResponse.json({error:"from and to are required"},{status:400});
  const {data,error}=await supabaseAdmin.from("visitors").select("*").gte("check_in",istDateBoundary(from,false)).lte("check_in",istDateBoundary(to,true)).order("check_in",{ascending:false});
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({visitors:data});
}
