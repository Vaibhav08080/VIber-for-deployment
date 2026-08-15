import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan amounts in paise (₹499 = 49900 paise)
const PLAN_AMOUNTS: Record<string, number> = {
  pro: 49900, // ₹499
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body?.plan ?? "pro";
    const amount = PLAN_AMOUNTS[plan];

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Invalid plan or amount too low (minimum 100 paise)" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    console.error("Razorpay create-order error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
