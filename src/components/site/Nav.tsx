import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/site/BrandMark";
import { useSession } from "@/lib/use-session";
import { isAdminEmail } from "@/lib/models";


const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
  { to: "/contact", label: "Contact" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const isAdmin = isAdminEmail(user?.email);
  const consoleTo = user ? (isAdmin ? "/admin" : "/app") : "/auth";
  const consoleLabel = user ? "Open console" : "Sign in";


  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-3 mt-3 flex max-w-6xl sm:mx-auto sm:mt-4 items-center justify-between rounded-full glass px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display text-sm font-semibold text-foreground sm:text-base">
            Zettafry <span className="font-normal text-muted-foreground">— Bills to Excel</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-primary" }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={consoleTo}
            className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_28px_var(--glow)] md:inline-flex"
          >
            {consoleLabel}
          </Link>

          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-3 mt-2 max-w-6xl rounded-2xl glass p-4 sm:mx-auto md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to={consoleTo}
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-5 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {consoleLabel}
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}
