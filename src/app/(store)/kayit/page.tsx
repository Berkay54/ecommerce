import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentUser, safeReturnTo } from "@/lib/auth-user";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Üye Ol · Form & Field" };
type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};
export default function RegisterPage(props: RegisterPageProps) {
  return (
    <Suspense
      fallback={
        <main className="wrap auth-page" role="status">
          <p>Hesap bilgileri yükleniyor…</p>
        </main>
      }
    >
      <RegisterContent {...props} />
    </Suspense>
  );
}
async function RegisterContent({ searchParams }: RegisterPageProps) {
  const next = safeReturnTo((await searchParams).next);
  if (await currentUser()) redirect(next);
  return (
    <main className="wrap auth-page">
      <div className="auth-intro">
        <h1>Aramıza katılın</h1>
        <p>Adreslerinizi kaydedin, siparişlerinizi tek yerden yönetin.</p>
      </div>
      <AuthForm mode="register" next={next} />
    </main>
  );
}
