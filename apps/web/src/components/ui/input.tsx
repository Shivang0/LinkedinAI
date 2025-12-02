import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34] disabled:cursor-not-allowed disabled:opacity-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
