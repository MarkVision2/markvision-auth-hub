import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Building2, User, Phone, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NICHES = [
  "Стоматология",
  "Косметология",
  "Гинекология",
  "Офтальмология",
  "Педиатрия",
  "Многопрофильная клиника",
  "Другое",
];

const DEFAULT_PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

export function LeadModal({ open, onOpenChange }: LeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    office_name: "",
    niche: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any).from("leads_crm").insert({
        name: formData.name,
        phone: formData.phone,
        office_name: formData.office_name,
        service_category: formData.niche,
        source: "Landing Page",
        status: "Новая заявка",
        project_id: DEFAULT_PROJECT_ID,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Заявка принята!", description: "Мы свяжемся с вами в ближайшее время." });
      
      // Reset form after a delay or when modal closes
      setTimeout(() => {
        if (!open) {
          setSubmitted(false);
          setFormData({ name: "", phone: "", office_name: "", niche: "" });
        }
      }, 1000);

    } catch (err: any) {
      console.error("Lead submission error:", err);
      toast({
        title: "Ошибка отправки",
        description: err.message || "Попробуйте позже",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length === 0) {
      setFormData((f) => ({ ...f, phone: "" }));
      return;
    }

    let numbers = clean;
    if (numbers[0] !== "7") {
      numbers = "7" + numbers;
    }
    numbers = numbers.slice(0, 11);

    let formatted = "+7";
    if (numbers.length > 1) {
      formatted += " (" + numbers.slice(1, 4);
      if (numbers.length > 4) {
        formatted += ") " + numbers.slice(4, 7);
        if (numbers.length > 7) {
          formatted += "-" + numbers.slice(7, 9);
          if (numbers.length > 9) {
            formatted += "-" + numbers.slice(9, 11);
          }
        }
      }
    }
    setFormData((f) => ({ ...f, phone: formatted }));
  };

  const handleClose = () => {
    onOpenChange(false);
    if (submitted) {
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: "", phone: "", office_name: "", niche: "" });
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-background shadow-2xl">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8"
            >
              <DialogHeader className="mb-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Stethoscope className="h-7 w-7 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                  Забронировать аудит
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground font-medium mt-2">
                  Оставьте контакты, и мы проведем глубокий разбор маркетинга вашей клиники.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Ваше имя *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="name"
                      placeholder="Иван Иванов"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 h-12 bg-secondary/30 border-border/50 focus:border-primary transition-all rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Телефон *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="pl-10 h-12 bg-secondary/30 border-border/50 focus:border-primary transition-all rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Название клиники
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="office"
                      placeholder="MarkVision Clinic"
                      value={formData.office_name}
                      onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                      className="pl-10 h-12 bg-secondary/30 border-border/50 focus:border-primary transition-all rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Ниша клиники
                  </Label>
                  <Select
                    value={formData.niche}
                    onValueChange={(v) => setFormData({ ...formData, niche: v })}
                  >
                    <SelectTrigger className="h-12 bg-secondary/30 border-border/50 focus:border-primary transition-all rounded-xl">
                      <SelectValue placeholder="Выберите специализацию" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      {NICHES.map((n) => (
                        <SelectItem key={n} value={n} className="rounded-lg py-3">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-sm font-bold uppercase tracking-widest bg-primary hover:brightness-110 shadow-lg shadow-primary/20 transition-all rounded-xl mt-4"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "ОТПРАВИТЬ ЗАЯВКУ"
                  )}
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed px-4">
                  Нажимая кнопку, вы соглашаетесь на обработку персональных данных и условия политики конфиденциальности.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center flex flex-col items-center"
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Спасибо!</h2>
              <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
                Ваша заявка на аудит успешно принята. <br/>
                Наш эксперт свяжется с вами в течение рабочего дня.
              </p>
              <Button
                onClick={handleClose}
                variant="outline"
                className="rounded-xl px-10 h-11 font-bold border-border"
              >
                ЗАКРЫТЬ
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
