import { cn } from "@/lib/cn";

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    // force-dark: this mocks up the public bio page, which always renders
    // dark for visitors regardless of the dashboard's own theme — the
    // preview should show that reality, not the editor's own light/dark
    // setting.
    <div className={cn("force-dark relative mx-auto w-[300px] shrink-0", className)}>
      <div className="rounded-[2.5rem] border-[6px] border-shadow-elevated bg-shadow shadow-2xl">
        <div className="relative h-[600px] overflow-y-auto rounded-[2rem] bg-shadow">
          <div className="sticky top-0 z-10 mx-auto mt-2 h-5 w-24 rounded-full bg-shadow-elevated" />
          {children}
        </div>
      </div>
    </div>
  );
}
