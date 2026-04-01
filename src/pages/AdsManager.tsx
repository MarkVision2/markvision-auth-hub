import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Rocket, Search, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

export default function AdsManager() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ads_manager")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("ads_manager").delete().eq("id", id);
    if (!error) {
      toast({ title: "Удалено" });
      fetchAccounts();
    }
  };

  const filtered = accounts.filter(a => 
    a.account_name.toLowerCase().includes(search.toLowerCase()) || 
    a.ad_account_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ads Manager</h1>
            <p className="text-muted-foreground text-sm">Технические кабинеты только для запуска рекламы</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск..." 
                className="pl-9 h-10 bg-card border-border rounded-xl text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <AddAccountDialog onSuccess={fetchAccounts} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((acc) => (
            <Card key={acc.id} className="bg-card border-border/60 hover:border-primary/30 transition-all group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{acc.account_name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {acc.ad_account_id || '—'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(acc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-[10px] bg-secondary/30 border-border text-muted-foreground font-mono">
                    {acc.page_name || 'Страница не привязана'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/5">
                    <Rocket className="h-3.5 w-3.5" />
                    Запуск
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function AddAccountDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    account_name: "",
    ad_account_id: "",
    fb_token: "",
    page_id: "",
    page_name: ""
  });

  const handleSave = async () => {
    if (!form.account_name) return;
    setLoading(true);
    const { error } = await (supabase as any).from("ads_manager").insert(form);
    if (!error) {
      toast({ title: "Успешно добавлено" });
      setOpen(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-primary-foreground h-10 rounded-xl font-bold gap-2">
          <Plus className="h-4 w-4" />
          Добавить кабинет
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md bg-card border-border">
        <SheetHeader>
          <SheetTitle>Добавить Tech-кабинет</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-8">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input 
              value={form.account_name} 
              onChange={(e) => setForm({...form, account_name: e.target.value})}
              placeholder="Напр: Tech_Account_1" 
            />
          </div>
          <div className="space-y-2">
            <Label>Ad Account ID</Label>
            <Input 
              value={form.ad_account_id} 
              onChange={(e) => setForm({...form, ad_account_id: e.target.value})}
              placeholder="act_..." 
            />
          </div>
          <div className="space-y-2">
            <Label>Facebook Token</Label>
            <Input 
              value={form.fb_token} 
              onChange={(e) => setForm({...form, fb_token: e.target.value})}
              placeholder="EAAB..." 
            />
          </div>
          <div className="space-y-2">
            <Label>Page ID</Label>
            <Input 
              value={form.page_id} 
              onChange={(e) => setForm({...form, page_id: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Page Name</Label>
            <Input 
              value={form.page_name} 
              onChange={(e) => setForm({...form, page_name: e.target.value})}
            />
          </div>
          <Button className="w-full mt-4 font-bold" disabled={loading} onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
