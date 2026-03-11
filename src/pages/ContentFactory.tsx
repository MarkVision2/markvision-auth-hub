import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Video,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Users,
  Search,
  CheckCircle2,
  Download,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";
import ScenarioCreator from "@/components/content/ScenarioCreator";
import { CompetitorAnalysis } from "@/components/content/CompetitorAnalysis";

type TaskStatus = "pending" | "processing" | "completed" | "error";

interface ContentTask {
  id: string;
  status: TaskStatus;
  progress_text: string | null;
  result_urls: string[] | null;
  content_type: string;
  created_at?: string;
}

const MAX_HISTORY = 12;

export default function ContentFactory() {
  const { active } = useWorkspace();
  const [pageTab, setPageTab] = useState<"create" | "my-content" | "competitors">("create");
  const [history, setHistory] = useState<ContentTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch history from content_tasks (legacy video/photo generation)
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      let query = (supabase as any)
        .from("content_tasks")
        .select("id, status, progress_text, result_urls, content_type, created_at");

      if (active.id !== "hq") {
        query = query.eq("project_id", active.id);
      }

      const { data } = await query
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY);

      if (data) setHistory(data as ContentTask[]);
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [active.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-6xl py-4 flex flex-col h-[calc(100vh-80px)]">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
            <p className="text-sm text-muted-foreground mt-1">Создание сценариев · Мониторинг · AI-генерация</p>
          </div>

          {/* Page Tabs */}
          <div className="flex bg-secondary/20 rounded-xl p-1 border border-border">
            <button
              onClick={() => setPageTab("create")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "create" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Создать сценарий
            </button>
            <button
              onClick={() => setPageTab("my-content")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "my-content" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Clock className="h-3.5 w-3.5" /> Мой Контент
            </button>
            <button
              onClick={() => setPageTab("competitors")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "competitors" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Users className="h-3.5 w-3.5" /> Конкуренты
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ─── CREATE TAB ─── */}
          {pageTab === "create" && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
              <ScenarioCreator />
            </div>
          )}

          {/* ─── COMPETITORS TAB ─── */}
          {pageTab === "competitors" && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
              <CompetitorAnalysis />
            </div>
          )}

          {/* ─── MY CONTENT TAB (Legacy History) ─── */}
          {pageTab === "my-content" && (
            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">История ваших генераций (Видео и Фото)</p>
                <Button variant="ghost" size="sm" onClick={fetchHistory} className="h-8 text-xs gap-1.5 border-border">
                  <RotateCcw className="h-3 w-3" /> Обновить
                </Button>
              </div>

              {loadingHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-xl bg-secondary/20 animate-pulse border border-border" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border">
                  <Clock className="h-10 w-10 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-medium">История пуста</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Здесь будут отображаться ваши прошлые проекты</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.content_type === "video" ? <Video className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">{task.content_type === "video" ? "Видео" : "Фото"}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.status === "completed" ? "bg-[hsl(var(--status-good))]/10 border-[hsl(var(--status-good))]/30 text-[hsl(var(--status-good))]" :
                            task.status === "error" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                              "bg-primary/10 border-primary/30 text-primary animate-pulse"
                          }`}>
                          {task.status === "completed" ? "ГОТОВО" : task.status === "error" ? "ОШИБКА" : "В ПРОЦЕССЕ"}
                        </span>
                      </div>

                      <div className="aspect-video rounded-lg bg-secondary/30 overflow-hidden relative border border-border">
                        {task.result_urls?.[0] ? (
                          task.content_type === "video" ? (
                            <video src={task.result_urls[0]} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={task.result_urls[0]} alt="Result" className="w-full h-full object-cover" />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {task.result_urls?.[0] && (
                            <a href={task.result_urls[0]} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-primary text-white hover:scale-110 transition-transform">
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {task.created_at ? dateFmt(new Date(task.created_at), "dd.MM.yyyy HH:mm") : ""}
                        </span>
                        <div className="flex gap-1">
                          {/* Add more actions if needed */}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
