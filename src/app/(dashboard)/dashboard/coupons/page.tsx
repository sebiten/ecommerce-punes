import { getCouponsAdmin } from "@/actions/coupons";
import { CouponsManager } from "@/components/dashboard/coupons-manager";

export default async function CouponsPage() {
  const coupons = await getCouponsAdmin();

  return <CouponsManager initialCoupons={coupons} />;
}
