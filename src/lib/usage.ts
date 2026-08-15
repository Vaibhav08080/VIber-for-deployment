import { RateLimiterPrisma } from "rate-limiter-flexible";
import { prisma } from "./db";
import { auth } from "@clerk/nextjs/server";

const FREE_POINTS = 5;
const PRO_POINTS = 100;
const DURATION = 30 * 60; // 30 minutes
const GENERATION_COST = 1;

/**
 * Check if a user has an active Pro subscription via Razorpay.
 */
async function checkProAccess(userId: string): Promise<boolean> {
  try {
    const sub = await prisma.userSubscription.findUnique({
      where: { userId },
    });
    return sub?.isPro === true;
  } catch {
    return false;
  }
}

export async function getUsageTracker() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const hasProAccess = await checkProAccess(userId);
    const usageTracker = new RateLimiterPrisma({
      storeClient: prisma,
      tableName: "usage",
      points: hasProAccess ? PRO_POINTS : FREE_POINTS,
      duration: DURATION,
    });
    return usageTracker;
  } catch (error) {
    console.error("Failed to initialize usage tracker:", error);
    return null;
  }
}

export async function ConsumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  try {
    const usageTracker = await getUsageTracker();
    if (!usageTracker) return null;
    const result = await usageTracker.consume(userId, GENERATION_COST);
    return result;
  } catch (error) {
    console.error("Failed to consume credits:", error);
    return null;
  }
}

export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  try {
    const usageTracker = await getUsageTracker();
    if (!usageTracker) return null;
    const result = await usageTracker.get(userId);
    return result;
  } catch (error) {
    console.error("Failed to get usage status:\n", error);
    return null;
  }
}

/**
 * Get the Razorpay pro status of the current user.
 */
export async function getUserProStatus(): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;
    return await checkProAccess(userId);
  } catch {
    return false;
  }
}