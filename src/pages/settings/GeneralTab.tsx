import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Settings, Users, Upload, Phone, Briefcase,
    Globe, Coins, Clock, Globe2, Languages, Image as ImageIcon,
    Plus, ChevronRight, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function GeneralTab() {
    const { active, refreshProjects } = useWorkspace() as any;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    
    // Project Settings
    const [projectName, setProjectName] = useState("");
    const [projectLogo, setProjectLogo] = useState<string | null>(null);
    const [currency, setCurrency] = useState("₸");
    const [timezone, setTimezone] = useState("Asia/Almaty");
    const [language, setLanguage] = useState("ru");

    const fileRef = useRef<HTMLInputElement>(null);
    const logoRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setUserId(user.id);
                setEmail(user.email || "");

                const { data, error } = await supabase
                    .from("profiles")
                    .select("full_name, company_name, phone, avatar_url")
                    .eq("id", user.id)
                    .single();
                if (error) throw error;
                const profile = data as any;
                setName(profile?.full_name || "");
                setPhone(profile?.phone || "");
                setAvatarUrl(profile?.avatar_url || null);

                // Load active project settings
                if (active) {
                    setProjectName(active.name || "");
                    setProjectLogo(active.logoUrl || null);
                    setCurrency(active.currency || "₸");
                    setTimezone(active.timezone || "Asia/Almaty");
                    setLanguage(active.language || "ru");
                }
            } catch (e: any) {
                toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            // 1. Update Profile
            const { error: profErr } = await supabase
                .from("profiles")
                .update({
                    full_name: name.trim(),
                    phone: phone.trim(),
                } as any)
                .eq("id", userId);
            if (profErr) throw profErr;

            // 2. Update Project Settings
            if (active) {
                const { error: projErr } = await supabase
                    .from("projects")
                    .update({
                        name: projectName.trim(),
                        logo_url: projectLogo,
                        currency: currency,
                        timezone: timezone,
                        language: language,
                    })
                    .eq("id", active.id);
                if (projErr) throw projErr;
                await refreshProjects();
            }

            const { data: { user } } = await (supabase.auth as any).getUser();
            if (user && email.trim() !== user.email) {
                const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
                if (emailErr) throw emailErr;
                toast({ title: "Подтвердите новый email", description: "Ссылка отправлена на новый адрес" });
            }

            toast({ title: "Настройки успешно сохранены" });
        } catch (e: any) {
            toast({ title: "Ошибка", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Файл слишком большой", description: "Макс. 2 МБ", variant: "destructive" });
            return;
        }

        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `${userId}/avatar.${ext}`;

            const { error: upErr } = await supabase.storage
                .from("avatars")
                .upload(path, file, { upsert: true });
            if (upErr) throw upErr;

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(path);

            const url = `${publicUrl}?t=${Date.now()}`;

            const { error: profErr } = await supabase
                .from("profiles")
                .update({ avatar_url: url })
                .eq("id", userId);
            if (profErr) throw profErr;

            setAvatarUrl(url);
            toast({ title: "Фото обновлено" });
        } catch (e: any) {
            toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !active) return;
        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `projects/${active.id}/logo.${ext}`;
            const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
            setProjectLogo(`${publicUrl}?t=${Date.now()}`);
            toast({ title: "Логотип проекта загружен" });
        } catch (e: any) {
            toast({ title: "Ошибка логотипа", description: e.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const initials = name
        ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "MV";

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Настройки кабинета</h1>
                    <p className="text-sm text-muted-foreground mt-1">Персонализация профиля и конфигурация рабочего пространства</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings size={15} />}
                    {saving ? "Сохранение…" : "Сохранить всё"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section: Personal Profile */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-6 space-y-6 shadow-sm transition-all hover:border-border/60">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users size={16} className="text-primary" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-foreground/80">Личный профиль</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">{initials}</AvatarFallback>
                                </Avatar>
                                <button 
                                    onClick={() => fileRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-background"
                                >
                                    <Upload size={14} />
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">Фото профиля</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">Настройте свой аватар для <br/>лучшей узнаваемости в команде</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">ФИО</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} className="bg-background/50 border-border/30 h-10 transition-all focus:bg-background" disabled={loading} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">Email</Label>
                                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="bg-background/50 border-border/30 h-10 transition-all focus:bg-background" disabled={loading} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">Телефон</Label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-background/50 border-border/30 h-10 pl-9 transition-all focus:bg-background" disabled={loading} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/30 bg-primary/5 p-6 space-y-4 border-dashed">
                       <div className="flex items-center gap-3">
                           <Globe size={18} className="text-primary" />
                           <p className="text-sm font-bold">Публичный профиль</p>
                       </div>
                       <p className="text-xs text-muted-foreground leading-relaxed">
                           Эти данные будут видны вашим коллегам в разделе команды и при совместной работе над проектами.
                       </p>
                    </div>
                </div>

                {/* Section: Project Config */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-6 space-y-6 shadow-sm transition-all hover:border-border/60">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Briefcase size={16} className="text-primary" />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-foreground/80">Конфигурация проекта</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-2xl bg-accent/30 border border-border/30 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-primary/30 transition-colors">
                                    {projectLogo ? (
                                        <img src={projectLogo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={30} className="text-muted-foreground/20" />
                                    )}
                                </div>
                                <button 
                                    onClick={() => logoRef.current?.click()}
                                    className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-background border border-border/40 text-muted-foreground flex items-center justify-center shadow-md hover:text-primary transition-all cursor-pointer"
                                    title="Загрузить лого"
                                >
                                    <Plus size={14} />
                                </button>
                                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">Логотип проекта</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">Отображается в сайдбаре <br/>у всех участников проекта</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">Название проекта</Label>
                                <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="bg-background/50 border-border/30 h-10 transition-all focus:bg-background" disabled={loading} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">Валюта</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger className="bg-background/50 border-border/30 h-10">
                                            <div className="flex items-center gap-2">
                                                <Coins size={14} className="text-primary/60" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="₸">₸ (KZT)</SelectItem>
                                            <SelectItem value="$">$ (USD)</SelectItem>
                                            <SelectItem value="€">€ (EUR)</SelectItem>
                                            <SelectItem value="Br">Br (BYN)</SelectItem>
                                            <SelectItem value="₽">₽ (RUB)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">Язык</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger className="bg-background/50 border-border/30 h-10">
                                            <div className="flex items-center gap-2">
                                                <Languages size={14} className="text-primary/60" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ru">Русский</SelectItem>
                                            <SelectItem value="kk">Қазақша</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-muted-foreground/70 uppercase px-1">Часовой пояс</Label>
                                <Select value={timezone} onValueChange={setTimezone}>
                                    <SelectTrigger className="bg-background/50 border-border/30 h-10">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-primary/60" />
                                            <SelectValue />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia/Almaty">Almaty (GMT+5)</SelectItem>
                                        <SelectItem value="Asia/Astana">Astana (GMT+5)</SelectItem>
                                        <SelectItem value="Europe/Moscow">Moscow (GMT+3)</SelectItem>
                                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/30 bg-card/40 p-5 flex items-center justify-between group cursor-default shadow-sm transition-all hover:bg-card/60">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                <Globe2 size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Публичный URL</p>
                                <p className="text-xs text-muted-foreground">markvision.kz/dashboard</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground/40 hover:text-primary">
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
