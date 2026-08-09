/**
 * Curated Asset Library of Verified High-Resolution Unsplash CDN Image URLs
 * Categorized by domain to prevent broken image links in AI-generated web applications.
 */

export const CATEGORY_IMAGE_MAP: Record<string, string[]> = {
  jewelry: [
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", // Diamond Ring
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80", // Gold Necklace
    "https://images.unsplash.com/photo-1611591475777-233cd7a772c1?w=800&auto=format&fit=crop&q=80", // Silver Bracelet
    "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80", // Gemstone Earrings
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80", // Luxury Banner
  ],
  saas: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80", // Analytics Dashboard
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80", // Growth Chart
    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80", // Data Network
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80", // Tech Code Screen
  ],
  fashion: [
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80", // Stylish Coat
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80", // Women Fashion
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80", // Red Sneakers
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80", // Luxury Watch
  ],
  food: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80", // Pizza
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80", // Burger
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80", // Coffee
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80", // Salad Bowl
  ],
  realestate: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80", // Luxury Villa
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80", // Apartment Interior
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80", // Modern House
  ],
  avatars: [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80", // Female Avatar 1
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80", // Male Avatar 1
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", // Female Avatar 2
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80", // Male Avatar 2
  ],
  fitness: [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80", // Gym Workout
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80", // Yoga Pose
  ],
  default: [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80", // Laptop Working
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80", // Team Collaboration
  ]
};

/**
 * Resolves a broken image path or text placeholder to a verified Unsplash CDN URL
 */
export function getFallbackImageForContext(text: string, index: number = 0): string {
  const lower = text.toLowerCase();

  let category = "default";
  if (lower.includes("ring") || lower.includes("necklace") || lower.includes("jewel") || lower.includes("earring") || lower.includes("gold") || lower.includes("diamond")) {
    category = "jewelry";
  } else if (lower.includes("saas") || lower.includes("chart") || lower.includes("dash") || lower.includes("data") || lower.includes("tech") || lower.includes("code")) {
    category = "saas";
  } else if (lower.includes("cloth") || lower.includes("fashion") || lower.includes("shirt") || lower.includes("shoe") || lower.includes("wear") || lower.includes("jacket")) {
    category = "fashion";
  } else if (lower.includes("food") || lower.includes("pizza") || lower.includes("burger") || lower.includes("dish") || lower.includes("cafe") || lower.includes("coffee")) {
    category = "food";
  } else if (lower.includes("house") || lower.includes("villa") || lower.includes("home") || lower.includes("estate") || lower.includes("room")) {
    category = "realestate";
  } else if (lower.includes("user") || lower.includes("avatar") || lower.includes("profile") || lower.includes("person") || lower.includes("author")) {
    category = "avatars";
  } else if (lower.includes("gym") || lower.includes("fit") || lower.includes("sport") || lower.includes("workout")) {
    category = "fitness";
  }

  const pool = CATEGORY_IMAGE_MAP[category] || CATEGORY_IMAGE_MAP.default;
  return pool[index % pool.length];
}
