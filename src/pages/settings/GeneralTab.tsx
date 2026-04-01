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
import { useWorkspace, HQ_ID } from "@/hooks/useWorkspace";
import { useRole } from "@/hooks/useRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function GeneralTab() {
    const { active, refreshProjects, setActiveId } = useWorkspace() as any;
    const { role, loading: roleLoading } = useRole();
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

    const [stats, setStats] = useState({
        incoming: 0,
        outgoing: 0,
        bookings: 0,
        payments: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setUserId(user.id);
                setEmail(user.email || "");

                const { data: profileData, error } = await supabase
                    .from("profiles")
                    .select("full_name, phone")
                    .eq("id", user.id as any)
                    .single();
                if (error) throw error;
                const profile = profileData as any;
                setName(profile?.full_name || "");
                setPhone(profile?.phone || "");

                // Load active project settings
                if (active) {
                    setProjectName(active.name || "");
                    setProjectLogo(active.logoUrl || null);
                }

                // Fetch Efficiency Stats
                if (profile?.full_name) {
                    setLoadingStats(true);
                    
                    // 1. Calls (Zeroed out for future telephony table)
                    const incomingCount = 0;
                    const outgoingCount = 0;

                    // 2. Diagnostics from leads
                    const { data: leadsFetchData } = await supabase
                        .from("leads")
                        .select("amount, scheduled_at, is_diagnostic")
                        .eq("serviced_by", profile.full_name as any);
                    
                    const leadsRes = (leadsFetchData || []) as any[];
                    const diagBookings = leadsRes.filter(l => l.is_diagnostic && l.scheduled_at).length || 0;
                    const totalPayments = leadsRes.filter(l => l.is_diagnostic).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

                    setStats({
                        incoming: incomingCount,
                        outgoing: outgoingCount,
                        bookings: diagBookings,
                        payments: totalPayments
                    });
                }
            } catch (e: any) {
                toast({ title: "Ошибка загрузки", description: e.message || "Неизвестная ошибка", variant: "destructive" });
            } finally {
                setLoading(false);
                setLoadingStats(false);
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

            // 2. Update Project Settings - Only for Admins
            if (active && isAdmin) {
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

    const handleDeleteProject = async () => {
        if (!active || active.id === HQ_ID) return;
        
        const confirmName = window.prompt(`Чтобы подтвердить удаление проекта "${active.name}", введите его название полностью:`);
        if (confirmName !== active.name) {
            if (confirmName !== null) {
                toast({ title: "Удаление отменено", description: "Название введено неверно", variant: "destructive" });
            }
            return;
        }

        setSaving(true);
        try {
            const { id: projectId } = active;

            // 1. Get all client configs for this project
            const { data: configs } = await (supabase as any)
                .from("clients_config")
                .select("id")
                .eq("project_id", projectId);
            
            const configIds = (configs || []).map((c: any) => c.id);

            // 2. Cascade delete everything linked to these configs
            if (configIds.length > 0) {
                await (supabase as any).from("daily_data").delete().in("client_config_id", configIds);
                await (supabase as any).from("client_config_visibility").delete().in("client_config_id", configIds);
            }

            // 3. Delete directly linked project data
            const tablesWithProjectId = [
                "client_config_visibility",
                "clients_config",
                "project_members",
                "leads",
                "content_tasks",
                "monthly_plans",
                "competitor_configs"
            ];

            for (const table of tablesWithProjectId) {
                await (supabase as any).from(table).delete().eq("project_id", projectId);
            }
            
            // 4. Finally delete the project record
            const { error } = await (supabase as any).from("projects").delete().eq("id", projectId);
            if (error) throw error;

            toast({ title: "Проект удален", description: `Проект «${active.name}» и все его данные стерты.` });
            
            // Switch to HQ and clear local cache
            setActiveId(HQ_ID);
            await refreshProjects();
        } catch (e: any) {
            console.error("Delete Error:", e);
            toast({ title: "Ошибка при удалении", description: e.message, variant: "destructive" });
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

    const isAdmin = !roleLoading && (role === "superadmin" || role === "client_admin");

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

            <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'} gap-6`}>
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

                {/* Section: Project Config (Admin Only) */}
                {isAdmin && (
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
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section: Admin Efficiency (Standalone) */}
            <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-md p-6 space-y-6 shadow-sm transition-all hover:border-border/60">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Briefcase size={16} className="text-emerald-500" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground/80">Эффективность Администратора</h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-background/40 border border-border/20 space-y-1 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Входящие звонки</p>
                        <p className="text-2xl font-black text-foreground">{stats.incoming}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background/40 border border-border/20 space-y-1 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Исходящие звонки</p>
                        <p className="text-2xl font-black text-foreground">{stats.outgoing}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background/40 border border-border/20 space-y-1 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Записи на диагн.</p>
                        <p className="text-2xl font-black text-emerald-500">{stats.bookings}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-center">
                        <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Оплаты диагн.</p>
                        <p className="text-2xl font-black text-primary leading-none">
                            {new Intl.NumberFormat('ru-RU').format(stats.payments)} <span className="text-xs uppercase ml-0.5">₸</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Section: Danger Zone (Superadmin Only) */}
            {active && active.id !== HQ_ID && role === "superadmin" && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-6 space-y-6 transition-all hover:border-rose-500/40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-black uppercase tracking-widest text-rose-500">Опасная зона</h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Безвозвратное удаление проекта и всех связанных с ним данных</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="gap-2 h-10 px-4 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all border-none">
                                    <Trash2 size={15} />
                                    Удалить проект
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem] border-rose-500/20 bg-card backdrop-blur-2xl p-8 max-w-md">
                                <AlertDialogHeader className="space-y-4">
                                    <div className="mx-auto h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center">
                                        <AlertTriangle size={32} className="text-rose-500 animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <AlertDialogTitle className="text-2xl font-black text-foreground">Удалить проект?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground font-medium text-sm leading-relaxed">
                                            Вы собираетесь навсегда удалить проект <span className="text-foreground font-bold italic">«{active.name}»</span>. <br/>
                                            Все рекламные кабинеты, записи CRM, отчеты и настройки будут стерты без возможности восстановления.
                                        </AlertDialogDescription>
                                    </div>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-8 gap-3 sm:justify-center">
                                    <AlertDialogCancel className="h-12 px-6 rounded-2xl font-bold border-border hover:bg-accent text-sm">
                                        Отмена
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDeleteProject}
                                        className="h-12 px-8 rounded-2xl font-black bg-rose-500 hover:bg-rose-600 text-white text-sm shadow-xl shadow-rose-500/30 border-none"
                                    >
                                        Да, удалить навсегда
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
        </div>
    );
}
