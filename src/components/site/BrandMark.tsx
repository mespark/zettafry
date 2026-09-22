import logo from "@/assets/zettafry-logo.png";

export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
    >
      <img src={logo} alt="" className="size-full object-contain drop-shadow-[0_0_16px_-4px_var(--glow)]" />
    </span>
  );
}