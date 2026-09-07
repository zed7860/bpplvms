import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";
export async function POST() {
  const r=NextResponse.json({ok:true}); r.cookies.set(COOKIE,"",{httpOnly:true,path:"/",maxAge:0}); return r;
}
