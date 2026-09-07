import { NextRequest, NextResponse } from "next/server";
import { makeSession, COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const {password} = await req.json();
  if (!password || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({error:"Invalid password"},{status:401});
  const res = NextResponse.json({ok:true});
  res.cookies.set(COOKIE, makeSession(), {httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"lax", path:"/", maxAge:60*60*12});
  return res;
}
