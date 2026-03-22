import { Image as ImageIcon, Film, Play, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  contentMode: "photo" | "video";
  format: string;
  aspectRatio: string;
  designPrompt: string;
  exactText: string;
  referencePreview: string | null;
  logoFile: File | null;
}

export function PhoneMockup({ contentMode, format, designPrompt, exactText, referencePreview, logoFile }: Props) {
  const slides = (exactText || "")
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^слайд\s*\d+\s*[:：]\s*/i, "").trim())
    .filter(Boolean);

  const hasContent = designPrompt.trim() || exactText.trim() || referencePreview;
  const isCarousel = format.startsWith("carousel");
  const slideCount = format === "carousel-7" ? 7 : format === "carousel-10" ? 10 : 1;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-3">Превью</p>

      {/* Phone frame */}
      <div className="relative w-[220px]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-background rounded-b-xl z-20" />

        {/* Phone body */}
        <div className="rounded-[28px] border-2 border-border bg-background overflow-hidden shadow-xl">
          {/* Status bar */}
          <div className="h-8 bg-background flex items-end justify-between px-5 pb-0.5">
            <span className="text-[8px] font-medium text-foreground/60">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 rounded-sm border border-foreground/40" />
            </div>
          </div>

          {/* Content area */}
          <div className="min-h-[360px] max-h-[400px] overflow-hidden">
            <AnimatePresence mode="wait">
              {!hasContent ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[360px] flex flex-col items-center justify-center gap-3 px-4"
                >
                  <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center">
                    {contentMode === "video" ? (
                      <Film className="h-5 w-5 text-muted-foreground/30" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
                    Заполните ТЗ —<br />превью появится здесь
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  {/* Post header */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
                      {logoFile ? (
                        <span className="text-[6px] font-bold text-primary">L</span>
                      ) : (
                        <span className="text-[6px] font-bold text-primary">AI</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-foreground truncate">your_brand</p>
                    </div>
                    <MoreHorizontal className="h-3 w-3 text-muted-foreground/50" />
                  </div>

                  {/* Image area */}
                  <div className="relative bg-gradient-to-br from-muted/40 via-muted/20 to-accent/20 aspect-[4/5] flex items-center justify-center overflow-hidden">
                    {referencePreview ? (
                      <img src={referencePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                        {contentMode === "video" && (
                          <div className="h-10 w-10 rounded-full bg-background backdrop-blur-sm flex items-center justify-center border border-border/50">
                            <Play className="h-4 w-4 text-foreground/70 ml-0.5" />
                          </div>
                        )}
                        {designPrompt.trim() && (
                          <p className="text-[8px] text-center text-foreground/40 leading-relaxed line-clamp-4 max-w-[160px]">
                            {designPrompt.slice(0, 120)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Carousel dots */}
                    {isCarousel && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {Array.from({ length: Math.min(slideCount, 7) }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all ${i === 0 ? "w-2 bg-primary" : "w-1 bg-foreground/20"}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Format badge */}
                    <div className="absolute top-2 right-2 bg-background backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-border/30">
                      <span className="text-[7px] font-mono font-medium text-foreground/60">9:16</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-foreground/60" />
                      <MessageCircle className="h-4 w-4 text-foreground/60" />
                      <Send className="h-4 w-4 text-foreground/60" />
                    </div>
                    <Bookmark className="h-4 w-4 text-foreground/60" />
                  </div>

                  {/* Caption preview */}
                  {slides.length > 0 && (
                    <div className="px-3 pb-3">
                      <p className="text-[9px] text-foreground/80 leading-relaxed line-clamp-3">
                        <span className="font-semibold">your_brand</span>{" "}
                        {slides[0]}
                      </p>
                      {slides.length > 1 && (
                        <p className="text-[8px] text-muted-foreground/50 mt-0.5">
                          ещё {slides.length - 1} слайд{slides.length - 1 > 4 ? "ов" : slides.length - 1 > 1 ? "а" : ""}...
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom bar */}
          <div className="h-5 bg-background flex items-center justify-center">
            <div className="w-16 h-1 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>

      {/* Info below */}
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center space-y-1"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-medium text-foreground/70">
              {contentMode === "video" ? "🎬 Видео" : "📸 Фото"}
            </span>
            <span className="text-[10px] text-muted-foreground/50">•</span>
            <span className="text-[10px] font-mono text-muted-foreground">9:16</span>
          </div>
          {slides.length > 0 && (
            <p className="text-[9px] text-muted-foreground/50">{slides.length} слайд(ов) с текстом</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
