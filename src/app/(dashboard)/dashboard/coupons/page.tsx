import { getCouponsAdmin } from "@/actions/coupons";
import { CouponsManager } from "@/components/dashboard/coupons-manager";
import { requireAdmin } from "@/actions/auth";

export default async function CouponsPage() {
  await requireAdmin();
  const coupons = await getCouponsAdmin();

  return <CouponsManager initialCoupons={coupons} />;
}
