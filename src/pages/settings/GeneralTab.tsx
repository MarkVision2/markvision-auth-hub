import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Settings, Users, Upload, Phone, Briefcase,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function GeneralTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [company, setCompany] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

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
                setName(data?.full_name || "");
                setCompany(data?.company_name || "");
                setPhone((data as unknown)?.phone || "");
                setAvatarUrl(data?.avatar_url || null);
            } catch (e: unknown) {
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
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: name.trim(),
                    company_name: company.trim(),
                    phone: phone.trim(),
                } as unknown)
                .eq("id", userId);
            if (error) throw error;

            const { data: { user } } = await supabase.auth.getUser();
            if (user && email.trim() !== user.email) {
                const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
                if (emailErr) throw emailErr;
                toast({ title: "Подтвердите новый email", description: "Ссылка отправлена на новый адрес" });
            }

            toast({ title: "Профиль сохранён" });
        } catch (e: unknown) {
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
        } catch (e: unknown) {
            toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const initials = name
        ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "MV";

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Общие настройки</h1>
                <p className="text-sm text-muted-foreground mt-1">Управление профилем и параметрами кабинета</p>
            </div>

            <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <Users size={13} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Личный профиль</span>
                </div>

                <div className="flex items-center gap-5">
                    <Avatar className="h-16 w-16">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Фото профиля</p>
                        <p className="text-[11px] text-muted-foreground">JPG, PNG. Макс 2 МБ</p>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-primary hover:text-primary mt-0.5"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading || loading}
                        >
                            <Upload size={12} />{uploading ? "Загрузка…" : "Загрузить"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Имя</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} className="bg-accent/30 border-border/30" disabled={loading} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="bg-accent/30 border-border/30" disabled={loading} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Телефон</Label>
                        <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                            <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-accent/30 border-border/30 pl-9" disabled={loading} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <Briefcase size={13} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Настройка кабинета</span>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Название компании</Label>
                    <Input value={company} onChange={e => setCompany(e.target.value)} className="bg-accent/30 border-border/30" disabled={loading} />
                </div>
            </div>

            <Button className="gap-2" onClick={handleSave} disabled={saving || loading}>
                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Settings size={15} />}
                {saving ? "Сохранение…" : "Сохранить изменения"}
            </Button>
        </div>
    );
}
