import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ isPro: false }, { status: 401 });
    }

    const sub = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    return NextResponse.json({ isPro: sub?.isPro === true });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ isPro: false }, { status: 500 });
  }
}
