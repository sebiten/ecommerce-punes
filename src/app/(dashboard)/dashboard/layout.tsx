import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getProfile } from "@/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login?redirect_url=/dashboard");
  }

  const profile = await getProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
