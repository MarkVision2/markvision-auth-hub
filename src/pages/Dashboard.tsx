import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout breadcrumb="Дашборд">
      <h1 className="text-2xl font-bold text-foreground">Дашборд</h1>
      <p className="text-muted-foreground mt-2">Добро пожаловать в MarkVision.</p>
    </DashboardLayout>
  );
}
