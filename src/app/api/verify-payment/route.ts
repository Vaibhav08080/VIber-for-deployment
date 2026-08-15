import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Upsert the subscription record
    await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        isPro: true,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        planType: "pro",
      },
      create: {
        userId,
        isPro: true,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        planType: "pro",
      },
    });

    return NextResponse.json({ success: true, isPro: true });
  } catch (error: unknown) {
    console.error("Razorpay verify-payment error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
