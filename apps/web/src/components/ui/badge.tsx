import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center border-2 border-[#f4f4f4] px-2 py-0.5 font-retro text-base whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all",
  {
    variants: {
      variant: {
        default: "bg-[#e43b44] text-[#f4f4f4]",
        secondary: "bg-[#63c74d] text-[#1a1c2c]",
        destructive: "bg-[#e43b44] text-[#f4f4f4]",
        outline: "bg-transparent text-[#f4f4f4]",
        success: "bg-[#63c74d] text-[#1a1c2c]",
        warning: "bg-[#feae34] text-[#1a1c2c]",
        info: "bg-[#0099db] text-[#f4f4f4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
