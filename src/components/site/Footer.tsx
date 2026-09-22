import { Link } from "@tanstack/react-router";
import { Instagram, Github } from "lucide-react";
import { BrandMark } from "@/components/site/BrandMark";

export function Footer() {
  return (
    <footer className="relative mt-20 border-t sm:mt-32 border-border/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-6 sm:py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-sm font-semibold">Zettafry — Bills to Excel</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Intelligent invoice processing that turns bills and receipts into structured Excel data.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Company</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
            <Link to="/services" className="text-muted-foreground hover:text-foreground">Services</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Get started</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground">Sign in</Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Reach us</h4>
          <a href="mailto:contact@mespark.in" className="mt-4 block text-sm text-muted-foreground hover:text-foreground">
            contact@mespark.in
          </a>
          <div className="mt-6 border-t border-border/60 pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Created by</p>
            <p className="mt-2 text-sm font-medium text-foreground">mespark</p>
            <div className="mt-2 flex flex-col gap-2">
              <a
                href="https://www.instagram.com/mespark.py/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-foreground"
              >
                <Instagram className="size-4" /> @mespark.py
              </a>
              <a
                href="https://github.com/mespark"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-foreground"
              >
                <Github className="size-4" /> @mespark
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Zettafry — Bills to Excel. All rights reserved. ·{" "}
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>{" "}
        ·{" "}
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
      </div>
    </footer>
  );
}
