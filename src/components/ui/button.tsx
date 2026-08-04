import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Reads --sf-radius-cta directly rather than Tailwind's rounded-xl: this
  // project scales the radius steps off --radius (0.625rem), so rounded-xl
  // resolves to 14px. Pointing at the token keeps this and .sf-btn identical.
  "group/button inline-flex shrink-0 items-center justify-center rounded-(--sf-radius-cta) border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    // Colors below are the same --sf-* arbitrary-value references the
    // Untitled UI button (components/base/buttons/button.tsx) uses for its
    // primary/secondary/tertiary/destructive/link-color looks — this Button
    // still stays on Base UI underneath (it's composed via `render` inside
    // AlertDialog, Dialog, Toast, Sidebar, etc., which Untitled's React-Aria
    // button can't be), but reads the identical source values so every CTA
    // looks like one family regardless of which engine renders it.
    variants: {
      variant: {
        default: "bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent-hover)]",
        outline:
          "bg-[var(--sf-card)] text-[var(--sf-text)] border-[var(--sf-card-border)] hover:bg-[var(--sf-raised)] aria-expanded:bg-[var(--sf-raised)]",
        secondary:
          "bg-[var(--sf-card)] text-[var(--sf-text)] border-[var(--sf-card-border)] hover:bg-[var(--sf-raised)] aria-expanded:bg-[var(--sf-raised)]",
        ghost:
          "text-[var(--sf-text)] hover:bg-[var(--sf-raised)] aria-expanded:bg-[var(--sf-raised)]",
        destructive:
          "bg-[var(--sf-card)] text-[var(--sf-error-text)] border-[#f0c5ca] hover:bg-[var(--sf-error-bg)] focus-visible:border-[var(--sf-error-text)] focus-visible:ring-[var(--sf-error-text)]/20",
        link: "text-[var(--sf-link)] underline-offset-4 hover:underline hover:text-[var(--sf-accent-hover)]",
      },
      size: {
        // A fixed h-* with no vertical padding read as flat and cramped
        // next to .sf-btn (which does carry real top/bottom padding) — every
        // text size below now sizes off padding instead, so the label has
        // real breathing room rather than being squeezed into a fixed box.
        default:
          "h-auto gap-1.5 py-2.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-auto gap-1 py-1.5 px-3.5 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-auto gap-1 py-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-auto gap-1.5 py-3 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
