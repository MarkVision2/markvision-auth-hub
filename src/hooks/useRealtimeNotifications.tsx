import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

/* Payload row types — mirrors Supabase table schemas */
interface ContentTaskRow {
  status: string;
  content_type: string;
  progress_text: string | null;
}
interface LeadRow {
  name: string;
  source: string | null;
  phone: string | null;
}
interface CompetitorAdRow {
  is_monitored: boolean;
  advertiser_name: string | null;
  page_name: string | null;
}
/**
 * Subscribes to Supabase Realtime events and pushes
 * notifications into the global Notification Center.
 *
 * – content_tasks: UPDATE (status → "completed" | "error")
 * – leads: INSERT (new lead arrived)
 * – competitor_ads: INSERT (new competitor ad scraped)
 */
export function useRealtimeNotifications() {
  const { pushNotification } = useNotifications();

  useEffect(() => {
    // 1. Content Factory — task finished / failed
    const contentChannel = supabase
      .channel("notify_content_tasks")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "content_tasks" },
        (payload) => {
          const row = payload.new as ContentTaskRow;
          const old = payload.old as ContentTaskRow;

          // Only fire when status actually changed
          if (old.status === row.status) return;

          if (row.status === "completed") {
            pushNotification(
              "info",
              "Контент готов ✅",
              `Задача «${row.content_type}» успешно завершена`,
              "Контент-Завод"
            );
          } else if (row.status === "error" || row.status === "failed") {
            pushNotification(
              "error",
              "Ошибка генерации контента",
              row.progress_text || "Произошла ошибка при создании контента",
              "Контент-Завод"
            );
          }
        }
      )
      .subscribe();

    // 2. CRM — new lead arrived
    const leadsChannel = supabase
      .channel("notify_leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const lead = payload.new as LeadRow;
          pushNotification(
            "info",
            "Новый лид 🎯",
            `${lead.name}${lead.source ? ` · ${lead.source}` : ""}${lead.phone ? ` · ${lead.phone}` : ""}`,
            "CRM"
          );
        }
      )
      .subscribe();

    // 3. Competitor ads — new ad scraped
    const competitorChannel = supabase
      .channel("notify_competitor_ads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "competitor_ads" },
        (payload) => {
          const ad = payload.new as CompetitorAdRow;
          if (ad.is_monitored) {
            pushNotification(
              "warning",
              "Новая реклама конкурента 📡",
              `${ad.advertiser_name || ad.page_name || "Конкурент"} запустил новое объявление`,
              "Радар конкурентов"
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contentChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(competitorChannel);
    };
  }, [pushNotification]);
}
