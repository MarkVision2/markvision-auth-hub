import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
          return;
        }
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { company_name: companyName, full_name: companyName },
          },
        });
        if (error) {
          toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Проверьте почту", description: "Мы отправили письмо для подтверждения." });
      }
    } catch (err: any) {
      toast({ title: "Непредвиденная ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) {
        toast({ title: "Ошибка Google", description: error.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left — Branding */}
      <div className="relative flex w-full items-center justify-center bg-card px-8 py-16 lg:w-1/2 lg:py-0">
        <div className="dot-pattern absolute inset-0" />
        <div className="relative z-10 max-w-lg">
          <div className="mb-8 flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-foreground">MarkVision</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-foreground">
            Ваша автономная Marketing&nbsp;OS.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Управление трафиком, генерация контента и сквозная аналитика в единой экосистеме.
          </p>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex w-full items-center justify-center bg-background px-6 py-16 lg:w-1/2 lg:py-0">
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="mb-8 flex rounded-lg border border-border bg-input p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                activeTab === "login"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                activeTab === "signup"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
                  Имя компании
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-secondary-foreground">Пароль</label>
                {activeTab === "login" && (
                  <button type="button" className="text-xs text-primary hover:underline">
                    Забыли пароль?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {activeTab === "login" ? "Войти в систему" : "Создать аккаунт"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">или продолжить через</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-transparent py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Войти через Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
