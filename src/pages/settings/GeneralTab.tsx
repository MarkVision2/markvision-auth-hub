import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Settings, Users, Upload, Phone, Briefcase,
    Image as ImageIcon, Plus, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRole } from "@/hooks/useRole";

export default function GeneralTab() {
    const { active, refreshProjects } = useWorkspace() as any;
    const { role } = useRole();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    
    // Project Settings
    const [projectName, setProjectName] = useState("");
    const [projectLogo, setProjectLogo] = useState<string | null>(null);

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
                    .select("full_name, phone")
                    .eq("id", user.id as any)
                    .single();
                if (error) throw error;
                const profile = data as any;
                setName(profile?.full_name || "");
                setPhone(profile?.phone || "");

                // Load active project settings
                if (active) {
                    setProjectName(active.name || "");
                    setProjectLogo(active.logoUrl || null);
                }
            } catch (e: any) {
                toast({ title: "Ошибка загрузки", description: e.message || "Неизвестная ошибка", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [active]);

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
                .eq("id", userId as any);
            if (profErr) throw profErr;

            // 2. Update Project Settings
            if (active) {
                const { error: projErr } = await supabase
                    .from("projects")
                    .update({
                        name: projectName.trim(),
                        logo_url: projectLogo,
                    } as any)
                    .eq("id", active.id as any);
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !active) return;
        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `projects/${active.id}/logo.${ext}`;
            
            // To ensure we can overwrite, we might need to remove old one or use upsert
            const { error: upErr } = await supabase.storage
                .from("avatars")
                .upload(path, file, { 
                    upsert: true,
                    cacheControl: '3600'
                });
            
            if (upErr) throw upErr;
            
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(path);
                
            setProjectLogo(`${publicUrl}?t=${Date.now()}`);
            toast({ title: "Логотип проекта загружен" });
        } catch (e: any) {
            console.error("Logo Upload Error:", e);
            toast({ 
                title: "Ошибка логотипа", 
                description: e.message || "Ошибка записи в хранилище Supabase. Возможно, не хватает прав (RLS).", 
                variant: "destructive" 
            });
        } finally {
            setUploading(false);
        }
    };

    const isAdmin = role === "superadmin" || role === "client_admin";

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

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-base font-black border border-primary/20">
                                {initials}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground">Данные сотрудника</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">Основная информация вашего профиля <br/>в системе</p>
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
                                {isAdmin && (
                                    <>
                                        <button 
                                            onClick={() => logoRef.current?.click()}
                                            className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-background border border-border/40 text-muted-foreground flex items-center justify-center shadow-md hover:text-primary transition-all cursor-pointer"
                                            title="Загрузить лого"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                    </>
                                )}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
