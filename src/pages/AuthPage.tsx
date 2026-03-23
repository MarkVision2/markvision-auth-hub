import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, BarChart3, Zap, Shield, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { motion } from "framer-motion";

const features = [
  { icon: BarChart3, title: "Сквозная аналитика", desc: "Все каналы в одном окне — от клика до продажи" },
  { icon: Zap, title: "AI-автоматизация", desc: "Генерация контента, аудит звонков, прогнозы" },
  { icon: Shield, title: "Контроль качества", desc: "AI-РОП проверяет каждый диалог менеджера" },
  { icon: TrendingUp, title: "Рост без хаоса", desc: "CRM, финансы и команда — всё под контролем" },
];

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  useEffect(() => {
    if (isReady && user) {
      const userRole = user.user_metadata?.role;
      if (userRole === "doctor") {
        navigate("/doctor/terminal", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Left — Hero */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-card px-8 py-16 lg:w-[55%] lg:py-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        </div>
        <div className="dot-pattern absolute inset-0 opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-xl"
        >
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">MarkVision</span>
          </div>

          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground lg:text-5xl">
            Управляйте бизнесом
            <br />
            <span className="text-primary">в одном месте</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Трафик, контент, продажи, финансы и команда — одна панель. AI следит за результатом 24/7.
          </p>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4 backdrop-blur-sm"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-[45%] lg:py-0">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            {activeTab === "login" ? "Добро пожаловать" : "Создать аккаунт"}
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            {activeTab === "login"
              ? "Войдите, чтобы продолжить работу"
              : "Зарегистрируйтесь и начните за 2 минуты"}
          </p>

          {/* Tabs */}
          <div className="mb-6 flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                activeTab === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                activeTab === "signup"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Название компании
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Digital Agency"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Пароль</label>
                {activeTab === "login" && (
                  <button type="button" className="text-xs text-primary hover:underline">
                    Забыли?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {activeTab === "login" ? "Войти" : "Начать бесплатно"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Продолжая, вы соглашаетесь с условиями использования сервиса
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
