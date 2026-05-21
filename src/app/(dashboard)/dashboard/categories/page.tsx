import { CategoriesManager } from "@/components/dashboard/categories-manager";
import { getCategoriesAdmin } from "@/actions/categories";

export default async function CategoriesPage() {
  const categories = await getCategoriesAdmin();

  return <CategoriesManager initialCategories={categories} />;
}
