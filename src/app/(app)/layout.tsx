import { AppSidebar } from "@/components/app-sidebar";
import { WeddingBackdrop } from "@/components/wedding-backdrop";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="wedding-shell min-h-dvh">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <WeddingBackdrop />
      </div>
      <div className="relative z-10 flex min-h-dvh flex-col md:flex-row">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-6 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
