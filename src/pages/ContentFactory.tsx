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
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format as dateFmt } from "date-fns";

import { useWorkspace } from "@/hooks/useWorkspace";
import ScenarioCreator from "@/components/content/ScenarioCreator";

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
  const [pageTab, setPageTab] = useState<"create" | "create-content" | "my-content">("create");
  const [history, setHistory] = useState<ContentTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [createType, setCreateType] = useState<"video" | "image">("video");
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateContent = async () => {
    setIsCreating(true);
    try {
      // Trigger the new webhook
      const webhookUrl = `https://n8n.zapoinov.com/webhook/content-factory-v2?project_id=${active.id}&type=${createType}`;

      // Sending request to n8n webhook
      // Usually webhooks are triggered via GET or POST depending on n8n config
      const res = await fetch(webhookUrl, {
        method: "GET",
        mode: "no-cors" // common for simple triggers
      });

      toast({
        title: "🚀 Запрос отправлен",
        description: `Генерация ${createType === 'video' ? 'видео' : 'фото'} запущена.`,
      });

      // Switch to history tab to see progress (if it updates in real-time)
      setTimeout(() => setPageTab("my-content"), 1500);

    } catch (err) {
      console.error("Webhook error:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось запустить генерацию.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <DashboardLayout breadcrumb="Контент-Завод">
      <div className="mx-auto max-w-6xl py-4 flex flex-col h-[calc(100vh-80px)]">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 text-center md:text-left">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Контент-Завод</h1>
            <p className="text-sm text-muted-foreground mt-1">Создание сценариев · Мониторинг · AI-генерация</p>
          </div>

          {/* Page Tabs */}
          <div className="flex bg-secondary/20 rounded-xl p-1 border border-border scale-90 md:scale-100 origin-right">
            <button
              onClick={() => setPageTab("create")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "create" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Сценарий
            </button>
            <button
              onClick={() => setPageTab("create-content")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "create-content" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <ImageIcon className="h-3.5 w-3.5" /> Создать контент
            </button>
            <button
              onClick={() => setPageTab("my-content")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${pageTab === "my-content" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Clock className="h-3.5 w-3.5" /> Мой Контент
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ─── CREATE SCENARIO TAB ─── */}
          {pageTab === "create" && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
              <ScenarioCreator />
            </div>
          )}

          {/* ─── CREATE CONTENT TAB ─── */}
          {pageTab === "create-content" && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-md w-full space-y-6 text-center">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Выберите тип контента</h2>
                  <p className="text-sm text-muted-foreground">Нажмите кнопку создания, чтобы запустить AI-генерацию</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCreateType("video")}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${createType === "video"
                      ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
                      : "bg-secondary/20 border-border hover:border-primary/50"}`}
                  >
                    <div className={`p-3 rounded-xl ${createType === "video" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                      <Video className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm">Видео</span>
                  </button>

                  <button
                    onClick={() => setCreateType("image")}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${createType === "image"
                      ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
                      : "bg-secondary/20 border-border hover:border-primary/50"}`}
                  >
                    <div className={`p-3 rounded-xl ${createType === "image" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm">Фото</span>
                  </button>
                </div>

                <Button
                  onClick={handleCreateContent}
                  disabled={isCreating}
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Запуск...
                    </div>
                  ) : (
                    "Создать контент"
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">
                <span>Webhook Integration</span>
                <div className="h-1 w-1 rounded-full bg-border" />
                <span>n8n Powered</span>
              </div>
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
