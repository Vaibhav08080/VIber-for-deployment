/**
 * SparkSite Pre-Styled Glassmorphism Block Components Registry
 * Provides production-grade React/Tailwind component code for AI composition.
 */

export const PREBUILT_BLOCK_INSTRUCTIONS = `
PRE-BUILT COMPONENT DESIGNS & STYLING TOKENS (MUST USE FOR ALL GENERATED APPS):

1. GLASSMORPHISM CONTAINER TOKENS:
   - Light Mode: "bg-white/80 backdrop-blur-xl border border-black/10 shadow-xl rounded-2xl"
   - Dark Mode: "dark:bg-[#121414]/80 dark:border-white/10 dark:shadow-2xl"
   - Glow Accent: "relative overflow-hidden before:absolute before:-top-24 before:-right-24 before:w-60 before:h-60 before:bg-gradient-to-br before:from-purple-500/20 before:to-amber-500/20 before:blur-3xl before:rounded-full"

2. PRODUCT CARD TEMPLATE (Must include images, star ratings, price discount badges & hover zoom):
\`\`\`tsx
export function ProductCard({ item, onAddToCart }: { item: any; onAddToCart?: (item: any) => void }) {
  return (
    <div className="group relative bg-white dark:bg-[#181a1b] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {item.discount && (
        <span className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
          {item.discount} OFF
        </span>
      )}
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1 text-amber-400 text-xs mb-1">
            {"★".repeat(item.rating || 5)}
            <span className="text-neutral-400 text-[11px] ml-1">({item.reviews || 24})</span>
          </div>
          <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
            {item.description || "Premium luxury collection piece designed for modern elegance."}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">\${item.price}</span>
            {item.oldPrice && (
              <span className="text-xs text-neutral-400 line-through">\${item.oldPrice}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart?.(item)}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black transition-colors shadow-sm cursor-pointer"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
\`\`\`

3. HERO SLIDER & GLOW HEADER TEMPLATE:
\`\`\`tsx
export function HeroHeader({ title, subtitle, ctaText, bgImage }: any) {
  return (
    <section className="relative min-h-[420px] rounded-3xl overflow-hidden mb-12 flex items-center justify-center p-8 text-center bg-neutral-950">
      <img src={bgImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
      <div className="relative z-10 max-w-2xl space-y-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/20 uppercase tracking-widest">
          Exclusive New Arrival
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-sm md:text-base text-neutral-300 max-w-lg mx-auto font-light">
          {subtitle}
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <button className="px-6 py-3 text-sm font-bold rounded-xl bg-white text-black hover:bg-neutral-100 transition-all shadow-lg cursor-pointer">
            {ctaText || "Explore Collection"}
          </button>
        </div>
      </div>
    </section>
  );
}
\`\`\`

4. SLIDE-OVER SHOPPING CART DRAWER:
- Include interactive quantity triggers (+/-), subtotal calculation, free shipping threshold bar, and checkout popup trigger.
`;
