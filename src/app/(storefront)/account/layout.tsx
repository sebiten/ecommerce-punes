import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/storefront/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login?redirect_url=/account/orders");
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <AccountNav />
      <div className="pt-6">{children}</div>
    </div>
  );
}
