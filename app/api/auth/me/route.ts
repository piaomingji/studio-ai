import { NextResponse } from "next/server";
import { getCurrentUser, saveUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Auto-migrate newly signed-up accounts from 3 to 6 credits
    if (user.plan === "free" && user.credits === 3) {
      user.credits = 6;
      user.updatedAt = new Date().toISOString();
      await saveUser(user);
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
