/**
 * Complete Pre-Installed 20+ Shadcn UI Component Suite
 * Pre-hydrated into E2B sandbox under components/ui/* on every project run.
 */

export const SHADCN_UI_FILES: Record<string, string> = {
  "components/ui/dialog.tsx": `"use client";
import * as React from "react";
import { X } from "lucide-react";

export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141617] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        {children}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
export function DialogHeader({ children }: any) {
  return <div className="space-y-1.5 text-left">{children}</div>;
}
export function DialogTitle({ children }: any) {
  return <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{children}</h2>;
}
export function DialogDescription({ children }: any) {
  return <p className="text-xs text-neutral-500 dark:text-neutral-400">{children}</p>;
}
`,

  "components/ui/sheet.tsx": `"use client";
import * as React from "react";
import { X } from "lucide-react";

export function Sheet({ open, onOpenChange, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-white dark:bg-[#141617] border-l border-black/10 dark:border-white/10 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <button
            onClick={() => onOpenChange?.(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
export function SheetHeader({ children }: any) {
  return <div className="space-y-1 pr-8">{children}</div>;
}
export function SheetTitle({ children }: any) {
  return <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{children}</h2>;
}
`,

  "components/ui/tabs.tsx": `"use client";
import * as React from "react";

export function Tabs({ defaultValue, value, onValueChange, children, className = "" }: any) {
  const [active, setActive] = React.useState(value || defaultValue);
  const current = value !== undefined ? value : active;

  const changeTab = (val: string) => {
    setActive(val);
    onValueChange?.(val);
  };

  return (
    <div className={"space-y-4 " + className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, { activeValue: current, onSelectTab: changeTab })
          : child
      )}
    </div>
  );
}

export function TabsList({ children, activeValue, onSelectTab, className = "" }: any) {
  return (
    <div className={"inline-flex items-center p-1.5 bg-neutral-100 dark:bg-[#1c1f20] border border-black/5 dark:border-white/10 rounded-2xl gap-1 " + className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, { activeValue, onSelectTab })
          : child
      )}
    </div>
  );
}

export function TabsTrigger({ value, activeValue, onSelectTab, children, className = "" }: any) {
  const isActive = activeValue === value;
  return (
    <button
      onClick={() => onSelectTab?.(value)}
      className={"px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer " + (isActive ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-md" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white") + " " + className}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeValue, children }: any) {
  if (value !== activeValue) return null;
  return <div className="animate-in fade-in duration-200">{children}</div>;
}
`,

  "components/ui/badge.tsx": `"use client";
import * as React from "react";

export function Badge({ children, variant = "default", className = "" }: any) {
  const variants: Record<string, string> = {
    default: "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
    secondary: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
    outline: "border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  };

  return (
    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-colors " + (variants[variant] || variants.default) + " " + className}>
      {children}
    </span>
  );
}
`,

  "components/ui/avatar.tsx": `"use client";
import * as React from "react";

export function Avatar({ src, alt, fallback = "U", className = "" }: any) {
  const [error, setError] = React.useState(false);

  return (
    <div className={"relative flex shrink-0 overflow-hidden rounded-full w-10 h-10 border border-black/10 dark:border-white/10 " + className}>
      {src && !error ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          onError={() => setError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300">
          {fallback}
        </div>
      )}
    </div>
  );
}
`,

  "components/ui/dropdown-menu.tsx": `"use client";
import * as React from "react";

export function DropdownMenu({ children }: any) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, { open, setOpen })
          : child
      )}
    </div>
  );
}
export function DropdownMenuTrigger({ children, open, setOpen }: any) {
  return (
    <div onClick={() => setOpen?.(!open)} className="cursor-pointer">
      {children}
    </div>
  );
}
export function DropdownMenuContent({ children, open, setOpen }: any) {
  if (!open) return null;
  return (
    <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl bg-white dark:bg-[#181a1b] border border-black/10 dark:border-white/10 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
      <div onClick={() => setOpen?.(false)}>{children}</div>
    </div>
  );
}
export function DropdownMenuItem({ children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
    >
      {children}
    </button>
  );
}
`,

  "components/ui/accordion.tsx": `"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";

export function Accordion({ children, className = "" }: any) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <div className={"divide-y divide-neutral-200 dark:divide-neutral-800 " + className}>
      {React.Children.map(children, (child, idx) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, {
              isOpen: openIndex === idx,
              onToggle: () => setOpenIndex(openIndex === idx ? null : idx),
            })
          : child
      )}
    </div>
  );
}

export function AccordionItem({ title, children, isOpen, onToggle }: any) {
  return (
    <div className="py-4">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between font-semibold text-sm text-neutral-900 dark:text-neutral-100 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={"w-4 h-4 text-neutral-500 transition-transform duration-200 " + (isOpen ? "rotate-180" : "")} />
      </button>
      {isOpen && <div className="pt-3 text-xs text-neutral-600 dark:text-neutral-400 animate-in fade-in duration-200">{children}</div>}
    </div>
  );
}
`,

  "components/ui/button.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm",
      destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
      outline: "border border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
      ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
      link: "text-neutral-900 dark:text-neutral-100 underline-offset-4 hover:underline",
    };
    const sizes: Record<string, string> = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-11 rounded-xl px-8 text-base",
      icon: "h-9 w-9 p-0",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variants[variant] || variants.default,
          sizes[size] || sizes.default,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
`,

  "components/ui/card.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md text-neutral-950 dark:text-neutral-50 shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
`,

  "components/ui/input.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
`,

  "components/ui/textarea.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
`,

  "components/ui/label.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-900 dark:text-neutral-100", className)}
      {...props}
    />
  );
}
`,

  "components/ui/switch.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({ checked = false, onCheckedChange, className = "" }: any) {
  const [isOn, setIsOn] = React.useState(checked);
  const active = onCheckedChange ? checked : isOn;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => {
        setIsOn(!active);
        onCheckedChange?.(!active);
      }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
        active ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white dark:bg-neutral-900 shadow-lg ring-0 transition-transform",
          active ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
`,

  "components/ui/progress.tsx": `"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800", className)}>
      <div
        className="h-full w-full flex-1 bg-neutral-900 dark:bg-white transition-all duration-300"
        style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
      />
    </div>
  );
}
`,

  "components/ui/separator.tsx": `"use client";
import * as React from "react";

export function Separator({ className = "" }: { className?: string }) {
  return <div className={"h-[1px] w-full bg-neutral-200 dark:bg-neutral-800 my-4 " + className} />;
}
`,
};
