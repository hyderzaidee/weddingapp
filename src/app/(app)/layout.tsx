import { AppSidebar } from "@/components/app-sidebar";
import { WeddingBackdrop } from "@/components/wedding-backdrop";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="wedding-shell min-h-screen md:flex">
      <WeddingBackdrop />
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
