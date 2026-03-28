import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-2xl border text-sm font-medium transition duration-200 outline-none active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--accent-strong)] bg-[color:var(--accent-strong)] text-white shadow-[0_20px_30px_-18px_rgba(13,148,136,0.8)] hover:border-[#07574e] hover:bg-[#07574e] hover:text-white focus-visible:ring-[color:var(--accent-faint)]",
        outline:
          "border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-white hover:text-[color:var(--foreground)] focus-visible:ring-[color:var(--accent-faint)]",
        secondary:
          "border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-white hover:text-[color:var(--foreground)] focus-visible:ring-[color:var(--accent-faint)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--foreground)] hover:bg-white/85 hover:text-[color:var(--foreground)] focus-visible:ring-[color:var(--accent-faint)]",
        destructive:
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-700 focus-visible:ring-red-100",
        link: "border-transparent p-0 text-[color:var(--accent-strong)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-4",
        xs: "h-8 gap-1.5 rounded-xl px-3 text-xs",
        sm: "h-10 gap-1.5 rounded-2xl px-3 text-sm",
        lg: "h-12 gap-2 px-5 text-base",
        icon: "size-11",
        "icon-xs": "size-8 rounded-xl",
        "icon-sm": "size-10 rounded-2xl",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

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
  );
}

export { Button, buttonVariants };
