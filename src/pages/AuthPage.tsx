import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowRight, Zap, Target, PhoneMissed, EyeOff, FileSpreadsheet, Send, Users, ImageMinus, CheckCircle2, PlayCircle, Clock, Workflow } from "lucide-react";
import { LeadModal } from "@/components/LeadModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { motion } from "framer-motion";

const problems = [
  { icon: PhoneMissed, stat: "–40%", statLabel: "потерянных заявок", title: "Пропущенные звонки", desc: "Администратор не берёт трубку после 18:00. Клиент уходит к конкурентам.", color: "text-red-500", bg: "bg-red-500/10" },
  { icon: EyeOff, stat: "0₸", statLabel: "понимания ROI", title: "Нет аналитики", desc: "Вы не знаете, откуда приходят клиенты и какая реклама работает.", color: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: FileSpreadsheet, stat: "3ч", statLabel: "в день впустую", title: "Ручная работа", desc: "Записи в тетради, отчёты в Excel, напоминания в голове. Ошибки неизбежны.", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: Send, stat: "–60%", statLabel: "бюджета впустую", title: "Деньги на ветер", desc: "Реклама крутится, но вы не знаете — окупается она или нет.", color: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: Users, stat: "0", statLabel: "контроля", title: "Нет контроля команды", desc: "Администраторы работают как хотят. Никто не отслеживает качество.", color: "text-pink-500", bg: "bg-pink-500/10" },
  { icon: ImageMinus, stat: "–70%", statLabel: "доверия", title: "Нет контента", desc: "Соцсети пустые. Клиенты не доверяют клинике без онлайн-присутствия.", color: "text-purple-500", bg: "bg-purple-500/10" }
];

const modules = [
  { num: "01", title: "Контент за вас", desc: "200+ постов и видео в месяц. Мы сами придумываем, снимаем и публикуем. Вам не нужен SMM-специалист." },
  { num: "02", title: "Запись 24/7", desc: "Бот отвечает клиентам в любое время: консультирует, отвечает на вопросы и записывает на приём." },
  { num: "03", title: "Понятная аналитика", desc: "Видите откуда пришёл каждый клиент и сколько принёс денег. Всё просто и наглядно." },
  { num: "04", title: "Учёт финансов", desc: "Все доходы и расходы в одном месте. Прямо в телефоне. Никаких таблиц Excel." },
  { num: "05", title: "Контроль команды", desc: "Система следит за работой администраторов: кто как отвечает, кто записал больше клиентов." },
  { num: "06", title: "Отчёты каждый день", desc: "Каждое утро получаете отчёт: сколько записей, сколько денег, что улучшить." }
];

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
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
      const { error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
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

  const scrollToLogin = () => {
    if (window.innerWidth < 1024) {
      document.getElementById('mobile-login-form')?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-background font-sans relative">
      
      {/* ─── LEFT SCROLLABLE AREA ─── */}
      <div className="w-full lg:w-7/12 xl:w-2/3 flex flex-col">
        
        {/* Header Navigation */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">MarkVision</span>
          </div>

          <div className="hidden sm:flex items-center gap-8 text-sm font-semibold text-muted-foreground mr-auto ml-12">
            <a href="#about" className="hover:text-primary transition-colors">О проекте</a>
            <a href="#features" className="hover:text-primary transition-colors">Возможности</a>
          </div>

          {/* Login button visible only on mobile to scroll down */}
          <button onClick={scrollToLogin} className="lg:hidden text-sm font-bold text-primary hover:underline">
            Войти
          </button>
        </header>

        {/* 01. Hero Section */}
        <section className="relative px-6 py-20 lg:px-12 xl:px-20 overflow-hidden bg-secondary/10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
          <div className="absolute top-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 fill-primary text-background" />
              <span>Умная система управления</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Хватит терять клиентов. <br/>
              Увеличьте выручку <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">без дополнительных расходов на рекламу</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground font-medium mb-10 max-w-xl leading-relaxed">
              Мы управляем маркетингом, продажами и аналитикой — <strong className="text-foreground">вы управляйте бизнесом</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button 
                onClick={() => setIsLeadModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] w-full sm:w-auto"
              >
                Забронировать аудит
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full sm:w-auto p-2">
                <PlayCircle className="h-12 w-12 text-primary" strokeWidth={1.5} />
                <div className="text-sm font-semibold leading-tight">
                  Посмотрите видео <span className="opacity-70 font-medium">(3 мин)</span><br/>
                  <span className="text-xs font-medium opacity-70">и получите доступ к полной демонстрации</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground/80">
              <Clock className="h-4 w-4" /> Обычно занимает 20 минут | Без обязательств
            </div>
          </div>
        </section>

        {/* 02. Problems Section */}
        <section className="px-6 py-20 lg:px-12 xl:px-20 bg-background border-t border-border/40">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-4">Знакомо?</h2>
            <h3 className="text-xl lg:text-2xl font-bold text-destructive mb-3">Эти проблемы убивают вашу прибыль</h3>
            <p className="text-muted-foreground font-medium text-lg mb-12">
              Каждый день без системы — это потерянные клиенты и деньги.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {problems.map((p, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${p.bg} ${p.color}`}>
                      <p.icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black tabular-nums tracking-tight ${p.color}`}>{p.stat}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">{p.statLabel}</div>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-foreground mb-2">{p.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 inline-block bg-primary/10 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground">MarkVision решает все эти проблемы</h3>
              </div>
              <p className="text-muted-foreground font-medium ml-9">
                Автоматически. Без найма новых сотрудников.
              </p>
            </div>
          </div>
        </section>

        {/* 03. How it Works — Redesigned Premium Version */}
        <section id="features" className="px-6 py-24 lg:px-12 xl:px-20 bg-secondary/5 border-t border-border/40 relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          <div className="max-w-5xl mx-auto relative z-10 text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-4">Как это работает</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
              Интеллектуальная экосистема, которая превращает рекламный охват в реальную прибыль клиники в автоматическом режиме.
            </p>
          </div>

          <div className="max-w-6xl mx-auto relative px-4 lg:px-0">
            {/* Desktop Visualization */}
            <div className="hidden md:flex items-center justify-between gap-4 relative py-12">
              
              {/* LEFT: Traffic Sources */}
              <div className="flex flex-col gap-6 z-20 w-[200px]">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2 text-center">Генерация трафика</div>
                {[
                  { name: "Instagram", color: "from-pink-500 to-purple-500" },
                  { name: "TikTok", color: "from-gray-900 to-teal-500" },
                  { name: "Google Ads", color: "from-blue-500 to-amber-500" }
                ].map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    className="relative group cursor-default"
                  >
                    <div className={`absolute -inset-1 blur-lg bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative px-6 py-4 rounded-2xl bg-card border border-border/60 shadow-sm backdrop-blur-md flex items-center justify-center font-bold text-sm text-foreground">
                      {item.name}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CENTER: AI CORE */}
              <div className="relative z-30 flex items-center justify-center">
                {/* Connecting Lines (Left to Center) */}
                <div className="absolute right-full mr-4 w-[100px] lg:w-[150px] top-1/2 -translate-y-1/2 overflow-visible pointer-events-none">
                  <svg width="100%" height="160" viewBox="0 0 150 160" fill="none" className="overflow-visible">
                    <motion.path 
                      d="M0 20 C60 20, 90 80, 150 80" 
                      stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/20"
                    />
                    <motion.path 
                      d="M0 80 L150 80" 
                      stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/20"
                    />
                    <motion.path 
                      d="M0 140 C60 140, 90 80, 150 80" 
                      stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/20"
                    />
                    {/* Pulsing Light Dots */}
                    {[20, 80, 140].map((y, i) => (
                      <motion.circle key={i} r="3" fill="var(--primary)">
                        <animateMotion 
                          dur={`${2 + i * 0.5}s`} repeatCount="indefinite" 
                          path={i === 0 ? "M0 20 C60 20, 90 80, 150 80" : (i === 1 ? "M0 80 L150 80" : "M0 140 C60 140, 90 80, 150 80")}
                        />
                      </motion.circle>
                    ))}
                  </svg>
                </div>

                <div className="relative">
                  {/* Rotating Orbits */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-16 border border-primary/10 rounded-full"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-24 border border-primary/5 rounded-full"
                  />
                  
                  {/* The Core */}
                  <div className="relative h-40 w-40 flex items-center justify-center rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.15)] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.2)_0%,transparent_70%)] animate-pulse" />
                    <div className="flex flex-col items-center relative z-10 mt-1">
                      <Zap className="h-12 w-12 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-2">MarkVision AI</div>
                      <div className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-widest opacity-60">Core Engine</div>
                    </div>
                  </div>
                </div>

                {/* Connecting Lines (Center to Right) */}
                <div className="absolute left-full ml-4 w-[100px] lg:w-[150px] top-1/2 -translate-y-1/2 overflow-visible pointer-events-none">
                  <svg width="100%" height="160" viewBox="0 0 150 160" fill="none" className="overflow-visible">
                    <motion.path 
                      d="M0 80 C60 80, 90 20, 150 20" 
                      stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/20"
                    />
                    <motion.path 
                      d="M0 80 L150 80" 
                      stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/20"
                    />
                    <motion.path 
                      d="M0 80 C60 80, 90 140, 150 140" 
                      stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/20"
                    />
                    {/* Pulsing Light Dots (Out) */}
                    {[20, 80, 140].map((y, i) => (
                      <motion.circle key={i} r="3" fill="var(--primary)">
                        <animateMotion 
                          dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" 
                          path={i === 0 ? "M0 80 C60 80, 90 20, 150 20" : (i === 1 ? "M0 80 L150 80" : "M0 80 C60 80, 90 140, 150 140")}
                        />
                      </motion.circle>
                    ))}
                  </svg>
                </div>
              </div>

              {/* RIGHT: Business Results */}
              <div className="flex flex-col gap-6 z-20 w-[200px]">
                 <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2 text-center">Рост прибыли</div>
                {[
                  { name: "CRM", detail: "Автозапись" },
                  { name: "Аналитика", detail: "ROI контроль" },
                  { name: "Финансы", detail: "Прозрачность" }
                ].map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                    whileHover={{ scale: 1.05, x: -5 }}
                    className="relative group cursor-default"
                  >
                    <div className="absolute -inset-1 blur-lg bg-primary/20 opacity-0 group-hover:opacity-40 transition-opacity" />
                    <div className="relative px-6 py-4 rounded-2xl bg-card border-2 border-primary/20 shadow-lg backdrop-blur-md flex flex-col items-center justify-center">
                      <div className="font-bold text-sm text-primary">{item.name}</div>
                      <div className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-tighter mt-0.5">{item.detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>

            {/* Mobile View — Simplified Vertical Flow */}
            <div className="flex md:hidden flex-col items-center gap-8 py-8">
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="px-4 py-3 rounded-xl bg-card border border-border text-center text-xs font-bold">Instagram</div>
                <div className="px-4 py-3 rounded-xl bg-card border border-border text-center text-xs font-bold">TikTok</div>
              </div>
              
              <div className="h-20 w-px bg-gradient-to-b from-border to-primary/40 relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-center text-xs font-bold text-primary">CRM</div>
                <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-center text-xs font-bold text-primary">Аналитика</div>
              </div>
            </div>
          </div>
        </section>

        {/* 04. Founder Story */}
        <section id="about" className="px-6 py-20 lg:px-12 xl:px-20 bg-background border-t border-border/40">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden border-4 border-border shadow-2xl max-w-sm w-full aspect-[3/4]">
                <img src="/yuri-mark.jpg" alt="Юрий с сыном Марком" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <div className="font-bold text-lg">Юрий с сыном Марком</div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-xs font-black uppercase text-primary tracking-widest mb-2">История проекта</h2>
              <h3 className="text-3xl font-extrabold text-foreground mb-6 leading-tight">
                Почему проект назван в честь моего сына?
              </h3>
              
              <div className="space-y-4 text-muted-foreground font-medium text-sm leading-relaxed">
                <p>
                  <strong className="text-foreground">MarkVision</strong> — это не просто название компании, это личное обязательство. Проект назван в честь моего сына Марка, что символизирует глубину ответственности, которую я несу за каждый результат.
                </p>
                <p>Это наш семейный стандарт качества, который я переношу в бизнес:</p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span><strong className="text-foreground">Личный контроль:</strong> Я лично проверяю результаты работы каждой клиники‑партнёра.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span><strong className="text-foreground">Системный подход:</strong> Мы выстраиваем процессы так, чтобы я мог с гордостью показать их итог своему сыну.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span><strong className="text-foreground">Наследие, а не просто услуга:</strong> Мы создаём не просто рекламные кампании, а внедряем порядок, системность и устойчивые бизнес‑процессы, на которых можно строить будущее.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-serif text-2xl font-bold text-foreground">Ю</div>
                <div>
                  <div className="font-bold text-foreground">Юрий Валерьевич</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Основатель MarkVision AI</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05. Modules */}
        <section className="px-6 py-20 lg:px-12 xl:px-20 bg-secondary/10 border-t border-border/40">
          <div className="max-w-4xl">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-4">Что внутри MarkVision</h2>
            <h3 className="text-xl lg:text-2xl font-bold text-primary mb-3">6 модулей, работающих 24/7</h3>
            <p className="text-muted-foreground font-medium text-lg mb-12">
              Каждый модуль автоматизирует процесс, который раньше требовал отдельного сотрудника.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {modules.map((m, i) => (
                <div key={i} className="flex flex-col bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-black text-4xl text-primary/20">{m.num}</div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Активен 24/7
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">{m.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed mt-auto">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="bg-card w-full mt-auto py-16 px-6 sm:px-12 xl:px-20 border-t border-border/40">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                   <Zap className="h-4 w-4 text-primary" />
                 </div>
                 <span className="text-xl font-bold tracking-tight text-foreground">MarkVision AI</span>
              </div>
               <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                 Первая автономная система управления прибылью для медицинского бизнеса. Наследие, созданное для будущего.
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm font-semibold text-foreground/80">
              <Link to="/blog" className="hover:text-primary transition-colors">Блог</Link>
              <a href="#" className="hover:text-primary transition-colors">Карьера</a>
              <a href="#" className="hover:text-primary transition-colors">База знаний</a>
              <a href="#" className="hover:text-primary transition-colors">Юридическое</a>
              <a href="#" className="hover:text-primary transition-colors col-span-2">Политика конфиденциальности</a>
              <a href="#" className="hover:text-primary transition-colors col-span-2">Пользовательское соглашение</a>
              <span className="text-muted-foreground font-normal col-span-2 mt-2">Соответствие Закону РК</span>
            </div>
            
            <div>
              <div className="text-sm font-bold text-foreground mb-4">Контакты</div>
              <a href="tel:+77472842595" className="block text-xl font-black text-primary hover:text-primary/80 transition-colors mb-2">
                +7 747 284 2595
              </a>
              <a href="mailto:admin@markvision.kz" className="block text-sm font-semibold hover:text-primary transition-colors text-muted-foreground">
                admin@markvision.kz
              </a>
            </div>
            
          </div>
          <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-border/30 text-center md:text-left text-xs font-semibold text-muted-foreground/50">
            © {new Date().getFullYear()} MarkVision AI. Все права защищены.
          </div>
        </footer>

      </div>

      {/* ─── RIGHT STICKY LOGIN AREA ─── */}
      <div id="mobile-login-form" className="w-full lg:w-5/12 xl:w-1/3 bg-background border-t lg:border-t-0 lg:border-l border-border/40 relative">
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center px-8 py-16 sm:px-12 xl:px-16 overflow-y-auto">
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="mb-10 lg:hidden flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">MarkVision</span>
            </div>

            <h2 className="mb-2 text-3xl font-bold text-foreground tracking-tight text-center lg:text-left">
              Добро пожаловать
            </h2>
            <p className="mb-8 text-sm text-muted-foreground font-medium text-center lg:text-left">
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
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 mt-4"
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

            <div className="mt-12 bg-primary/5 rounded-2xl p-5 border border-primary/10 text-center">
              <Workflow className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-bold text-foreground">Нужна помощь с входом?</div>
              <div className="text-xs text-muted-foreground mt-1">Обратитесь в поддержку или к своему менеджеру.</div>
            </div>
          </motion.div>
        </div>
      </div>

      <LeadModal open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen} />
    </div>
  );
}
