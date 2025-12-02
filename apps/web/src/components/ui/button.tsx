import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-retro text-lg transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-4 border-[#f4f4f4]",
  {
    variants: {
      variant: {
        default:
          "bg-[#e43b44] text-[#f4f4f4] hover:bg-[#c42f37] hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_#1a1c2c] hover:shadow-[2px_2px_0_#1a1c2c]",
        destructive:
          "bg-[#e43b44] text-[#f4f4f4] hover:bg-[#c42f37] hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_#1a1c2c]",
        outline:
          "bg-transparent text-[#f4f4f4] hover:bg-[#262b44] shadow-[4px_4px_0_#1a1c2c] hover:translate-x-[2px] hover:translate-y-[2px]",
        secondary:
          "bg-[#63c74d] text-[#1a1c2c] hover:bg-[#4da63a] hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_#1a1c2c]",
        ghost:
          "bg-transparent text-[#f4f4f4] hover:bg-[#262b44] border-transparent shadow-none",
        link: "text-[#0099db] underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-base",
        lg: "h-12 px-8 py-4",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
