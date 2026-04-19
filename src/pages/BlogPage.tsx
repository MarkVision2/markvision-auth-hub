import React from "react";
import { ArrowRight, Zap, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function BlogPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* ─── HEADER ─── */}
      <header className="w-full border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">MarkVision</span>
          </div>
          
          <button 
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            На главную <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 w-full flex flex-col items-center">
        {/* Title Section */}
        <section className="w-full bg-secondary/10 border-b border-border/30 py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-xl shadow-primary/5">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              Блог и База Знаний
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
              Статьи, разборы кейсов и практические руководства по масштабированию бизнеса с помощью IT-инструментов.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="w-full max-w-7xl mx-auto py-20 px-6 sm:px-12 lg:px-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Последние материалы</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockBlogPosts.map((post) => (
              <a key={post.id} href="#" className="group flex flex-col rounded-2xl bg-card border border-border/50 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
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
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="w-full bg-card/40 border-t border-border/40 py-12 px-6 sm:px-12 lg:px-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 opacity-80 hover:opacity-100 transition-opacity">
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                 <Zap className="h-4 w-4 text-primary" />
               </div>
               <span className="text-xl font-bold tracking-tight text-foreground">MarkVision</span>
            </div>
             <p className="text-xs text-muted-foreground font-medium max-w-[280px] leading-relaxed">
               Инновационная платформа для управления клиникой. Искусственный интеллект, маркетинг и автоматизация продаж в едином окне.
             </p>
          </div>
          
          <div className="flex flex-wrap gap-8 text-sm font-semibold text-foreground/80">
            <a href="#" className="hover:text-primary transition-colors">О компании</a>
            <a href="#" className="hover:text-primary transition-colors">Кейсы</a>
            <button onClick={() => navigate('/blog')} className="hover:text-primary transition-colors cursor-pointer">Блог</button>
            <a href="#" className="hover:text-primary transition-colors">Политика конфиденциальности</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 border-t border-border/30 pt-6 text-center md:text-left text-xs font-semibold text-muted-foreground/50">
          © {new Date().getFullYear()} MarkVision. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
