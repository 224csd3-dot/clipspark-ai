import { cn } from "@/lib/utils";

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative size-7 rounded-[8px] bg-gradient-to-br from-[#7C3AED] to-[#2563EB] shadow-[0_0_18px_-4px_rgba(124,58,237,0.65)]">
        <div className="absolute inset-[5px] rounded-[4px] bg-black/40 ring-1 ring-white/20" />
        <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_white]" />
      </div>
      {withWordmark && (
        <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
          ClipForge
        </span>
      )}
    </div>
  );
}
