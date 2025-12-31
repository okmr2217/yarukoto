import { getRequiredSession } from "@/lib/auth-server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated
  await getRequiredSession();

  return <>{children}</>;
}
