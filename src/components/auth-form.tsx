"use client";
import Link from "next/link";
import { useActionState } from "react";
import { register, login } from "@/app/auth-actions";
export function AuthForm({
  mode,
  next,
  registered = false,
}: {
  mode: "login" | "register";
  next: string;
  registered?: boolean;
}) {
  const [state, action, pending] = useActionState(
    mode === "register" ? register : login,
    {},
  );
  return (
    <form action={action} className="panel auth-form">
      <input type="hidden" name="next" value={next} />
      {registered && (
        <p className="notice" role="status">
          Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.
        </p>
      )}
      {mode === "register" && (
        <label>
          Ad Soyad
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
      )}
      <label>
        E-posta
        <input
          type="email"
          name="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      <label>
        Şifre
        <input
          type="password"
          name="password"
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          minLength={mode === "register" ? 12 : 1}
          maxLength={128}
          required
        />
      </label>
      {mode === "register" && (
        <>
          <p className="muted">Şifreniz en az 12 karakter içermelidir.</p>
          <label>
            Şifre Tekrar
            <input
              type="password"
              name="passwordConfirm"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
        </>
      )}
      <div aria-live="polite">
        {state.error && (
          <p className="notice error" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button className="button full" disabled={pending}>
        {pending
          ? "Lütfen bekleyin…"
          : mode === "register"
            ? "Üye Ol"
            : "Giriş Yap"}
      </button>
      <p className="auth-switch">
        {mode === "register"
          ? "Zaten hesabınız var mı?"
          : "Henüz üye değil misiniz?"}{" "}
        <Link
          href={`${mode === "register" ? "/giris" : "/kayit"}?next=${encodeURIComponent(next)}`}
          className="text-link"
        >
          {mode === "register" ? "Giriş Yap" : "Üye Ol"}
        </Link>
      </p>
    </form>
  );
}
