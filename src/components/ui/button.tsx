import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-b-4 border-b-blue-700 hover:bg-primary/90 active:border-b-0",
        destructive:
          "bg-destructive text-white border-b-4 border-b-red-700 hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:border-b-0",
        outline:
          "border-2 border-b-4 bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 active:border-b-2",
        secondary:
          "bg-secondary text-secondary-foreground border-b-4 border-b-slate-300 hover:bg-secondary/80 active:border-b-0",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground border-b-4 border-b-orange-700 hover:bg-accent/90 active:border-b-0",
        success: "bg-success text-success-foreground border-b-4 border-b-green-700 hover:bg-success/90 active:border-b-0",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-4",
        sm: "h-9 rounded-xl gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-14 rounded-2xl px-8 has-[>svg]:px-6 text-base",
        icon: "size-11 rounded-xl",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
