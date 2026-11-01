import { requireAdmin } from "@/lib/auth-user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";
export default function Admin() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminContent />
    </Suspense>
  );
}
async function AdminContent() {
  await requireAdmin();
  return redirect("/admin/products");
}
