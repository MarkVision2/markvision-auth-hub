import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, BarChart3, Zap, Shield, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { motion } from "framer-motion";

const features = [
  { icon: BarChart3, title: "Сквозная аналитика", desc: "Узнайте, какая реклама приносит выручку: от клика до кассы.", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { icon: Zap, title: "Автоматизация контента", desc: "Видео, фото и посты в 1 клик. Нейросети создают за вас.", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { icon: Shield, title: "AI-Контроль звонков", desc: "100% аудит диалогов менеджеров. Оценка скриптов и ошибок.", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { icon: TrendingUp, title: "Управление бизнесом", desc: "Трафик, финансы и KPI команды в одном интерактивном окне.", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
];

const mockBlogPosts = [
  {
    id: 1,
    title: "Как AI-технологии увеличивают конверсию в медицинских клиниках на 40%",
    excerpt: "Разбор реального кейса: как внедрение AI-РОПа для контроля звонков и сквозной аналитики позволило клинике вырасти без увеличения рекламного бюджета.",
    category: "Кейсы",
    date: "14 апреля 2026",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
    readTime: "5 мин",
  },
  {
    id: 2,
    title: "5 главных ошибок при настройке таргетированной рекламы",
    excerpt: "Почему вы сливаете бюджет? Анализ самых частых ошибок маркетологов на основе данных из нашей системы сквозной аналитики.",
    category: "Маркетинг",
    date: "10 апреля 2026",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    readTime: "7 мин",
  },
  {
    id: 3,
    title: "Контент-Завод: Как создавать Reels каждый день, не нанимая видеомейкера",
    excerpt: "Практическое руководство по модулю генерации MarkVision. Создаем сценарии, озвучку и монтаж с помощью нейросетей за 15 минут.",
    category: "Инструкции",
    date: "5 апреля 2026",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60",
    readTime: "4 мин",
  }
];

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const cleanInput = email.trim().toLowerCase();
    const finalEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@markvision-staff.io`;

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: finalEmail, 
        password 
      });
      if (error) {
        toast({ title: "Ошибка входа", description: error.message, variant: "destructive" });
        return;
      }
      navigate("/dashboard");
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
    <div className="min-h-screen bg-background overflow-y-auto font-sans">
      
      {/* ─── HERO SPLIT SECTION ─── */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        
        {/* Left — Marketing/Hero Info */}
        <div className="relative flex w-full items-center justify-center overflow-hidden bg-secondary/20 px-6 py-16 lg:w-7/12 lg:px-12 xl:px-20 lg:py-0 border-r border-border/40">
          {/* Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute top-1/2 right-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
          </div>
          
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-2xl"
          >
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
              <Zap className="h-3.5 w-3.5 fill-primary" />
              <span>Единая AI Экосистема</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-1" />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground lg:text-5xl xl:text-6xl">
              Бизнес под контролем
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                искусственного интеллекта
              </span>
            </h1>
            
            {/* Description */}
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground font-medium max-w-lg">
              Забудьте о разрозненных таблицах и рутине. MarkVision объединяет маркетинг, аналитику, генерацию контента и контроль отдела продаж в одну прозрачную платформу, которая работает на вас 24/7.
            </p>

            {/* Feature Cards Grid */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-md transition-all hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className={`mb-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${f.bg} ${f.border} ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground/80 font-medium">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Small stats / Trust markers */}
            <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-border/40 pt-6 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-blue-500/20" />
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-emerald-500/20" />
                  <div className="h-6 w-6 rounded-full border-2 border-background bg-primary/20" />
                </div>
                <span>Десятки интеграций</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Окупаемость с 1-го месяца</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right — Login Form */}
        <div className="flex w-full items-center justify-center px-6 py-16 lg:w-5/12 xl:w-[40%] lg:py-0 bg-background relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-sm xl:max-w-md mx-auto"
          >
            <h2 className="mb-2 text-3xl font-bold text-foreground tracking-tight">
              Добро пожаловать
            </h2>
            <p className="mb-8 text-sm text-muted-foreground font-medium">
              Войдите в систему, чтобы продолжить работу
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground">Email или Логин</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan_doc или ivan@markvision.kz"
                  className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Пароль</label>
                  <button type="button" className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors">
                    Забыли пароль?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Войти в платформу
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
              Нажимая кнопку, вы соглашаетесь с Политикой конфиденциальности и Условиями использования платформы
            </p>
          </motion.div>
        </div>

      </div>

      {/* ─── BLOG & KNOWLEDGE BASE SECTION ─── */}
      <section className="bg-card w-full py-20 lg:py-28 px-6 sm:px-12 lg:px-20 border-t border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">Последние материалы</h2>
              <p className="text-lg text-muted-foreground mt-3 font-medium">Статьи, разборы кейсов и практические руководства по масштабированию бизнеса с помощью IT-инструментов.</p>
            </div>
            {/* Optional "See All" button could go here */}
            <button className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/20 font-semibold text-sm text-primary hover:bg-primary hover:text-white transition-all">
              Все статьи <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockBlogPosts.map((post) => (
              <a key={post.id} href="#" className="group flex flex-col rounded-2xl bg-background border border-border/50 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300">
                {/* Image */}
                <div className="relative h-56 w-full overflow-hidden bg-secondary">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="backdrop-blur-md bg-black/40 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 p-6">
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground mb-3">
                    <span>{post.date}</span>
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    <span>{post.readTime} чтения</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center text-sm font-bold text-primary group-hover:gap-2 transition-all">
                    Читать далее <ArrowRight className="h-4 w-4 ml-1 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-10 md:hidden flex justify-center">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary/20 font-bold text-sm text-primary hover:bg-primary/5 transition-all">
              Перейти в блог <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default AuthPage;
