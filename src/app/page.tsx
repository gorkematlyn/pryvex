import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

// Placeholder entry point. The full marketing site is built after the
// core dashboard/product experience is complete (see project roadmap).
export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-shadow px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #64A0FF, #B998FF 60%, transparent 70%)" }}
      />
      <div className="relative z-10 text-4xl sm:text-5xl">
        <Logo />
      </div>
      <p className="relative z-10 mt-4 max-w-md text-sm text-alloy-dim sm:text-base">
        The link layer for creators. One page, one shortener, one analytics engine.
      </p>
      <div className="relative z-10 mt-8 flex gap-3">
        <Link href="/signup">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary" size="lg">
            Log in
          </Button>
        </Link>
      </div>
    </div>
  );
}
