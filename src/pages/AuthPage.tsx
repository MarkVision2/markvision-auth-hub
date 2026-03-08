import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  // Redirect if already logged in
  useEffect(() => {
    if (isReady && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isReady, user, navigate]);

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


  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null; // Will redirect via useEffect

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

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
