import { getRequiredSession } from "@/lib/auth-server";
import { Sidebar } from "@/components/layout";
import { FilterPanelProvider } from "@/components/layout/filter-panel-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated
  await getRequiredSession();

  return (
    <div className="min-h-screen">
      <FilterPanelProvider>
        <div className="flex max-w-6xl mx-auto min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">{children}</div>
        </div>
      </FilterPanelProvider>
    </div>
  );
}
