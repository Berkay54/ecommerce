import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentUser, safeReturnTo } from "@/lib/auth-user";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Giriş Yap · Form & Field" };
type LoginPageProps = {
  searchParams: Promise<{ next?: string; kayit?: string }>;
};
export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <main className="wrap auth-page" role="status">
          <p>Hesap bilgileri yükleniyor…</p>
        </main>
      }
    >
      <LoginContent {...props} />
    </Suspense>
  );
}
async function LoginContent({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const next = safeReturnTo(query.next);
  if (await currentUser()) redirect(next);
  return (
    <main className="wrap auth-page">
      <div className="auth-intro">
        <h1>Tekrar hoş geldiniz</h1>
        <p>Hesabınıza giriş yapın, siparişlerinizi takip edin.</p>
      </div>
      <AuthForm mode="login" next={next} registered={query.kayit === "1"} />
    </main>
  );
}
