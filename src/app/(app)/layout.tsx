import Sidebar from "@/components/Sidebar";
import { AppDataProvider } from "@/lib/app-data-context";
import { requireUser } from "@/lib/supabase/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppDataProvider>
      <Sidebar userEmail={user.email ?? ""} />
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
    </AppDataProvider>
  );
}
