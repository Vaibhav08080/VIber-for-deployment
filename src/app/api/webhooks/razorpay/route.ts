import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("[Razorpay Webhook] Missing webhook secret");
      return NextResponse.json({ error: "Webhook secret unconfigured" }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[Razorpay Webhook] Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log(`[Razorpay Webhook] Received event: ${event.event}`);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;

      const userId = payment?.notes?.userId || order?.notes?.userId;
      const orderId = payment?.order_id || order?.id;
      const paymentId = payment?.id;

      if (userId) {
        await prisma.userSubscription.upsert({
          where: { userId },
          update: {
            isPro: true,
            razorpayOrderId: orderId || undefined,
            razorpayPaymentId: paymentId || undefined,
            planType: "pro",
          },
          create: {
            userId,
            isPro: true,
            razorpayOrderId: orderId || undefined,
            razorpayPaymentId: paymentId || undefined,
            planType: "pro",
          },
        });
        console.log(`[Razorpay Webhook] Successfully upgraded userId ${userId} to Pro`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Razorpay Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
