import { getRequiredSession } from "@/lib/auth-server";
import { Sidebar } from "@/components/layout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated
  await getRequiredSession();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
