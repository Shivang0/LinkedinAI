import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[120px] w-full bg-[#1a1c2c] border-4 border-[#f4f4f4] px-3 py-2 font-retro text-lg text-[#f4f4f4] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#feae34] disabled:cursor-not-allowed disabled:opacity-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] resize-none",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
