import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, CheckCircle, TrendingUp, DollarSign, Activity, Stethoscope } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DiagnosticsDashboardPage = () => {
  // Mock data for the dashboard
  const stats = [
    {
      title: "Записей на диагностику",
      value: "156",
      change: "+12%",
      icon: Users,
    },
    {
      title: "Проведено диагностик",
      value: "142",
      change: "+8%",
      icon: Activity,
    },
    {
      title: "Выдано планов лечения",
      value: "98",
      change: "+15%",
      icon: FileText,
    },
    {
      title: "Оплачено курсов",
      value: "74",
      change: "+22%",
      icon: DollarSign,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Статистика Диагностики</h2>
        <div className="flex items-center space-x-2">
          {/* CalendarDateRangePicker can go here */}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500 font-medium">{stat.change}</span> по сравнению с прошлым месяцем
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Конверсия воронки диагностики</CardTitle>
            <CardDescription>
              Переход пациентов по этапам записи и лечения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div>
                  Заявка → Запись на диагностику
                </div>
                <span className="font-bold">68%</span>
              </div>
              <Progress value={68} className="h-2 bg-slate-100" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</div>
                  Запись → Приход на прием
                </div>
                <span className="font-bold">91%</span>
              </div>
              <Progress value={91} className="h-2 bg-slate-100" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs">3</div>
                  Приход → Выдача плана лечения
                </div>
                <span className="font-bold">69%</span>
              </div>
              <Progress value={69} className="h-2 bg-slate-100" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">4</div>
                  План лечения → Оплата курса
                </div>
                <span className="font-bold">75%</span>
              </div>
              <Progress value={75} className="h-2 bg-slate-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Популярные пакеты</CardTitle>
            <CardDescription>
              Распределение продаж по планам лечения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Базовый (5 сеансов)</p>
                  <p className="text-xs text-muted-foreground">32 покупки</p>
                </div>
                <div className="font-bold text-sm">43%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Оптимальный (10 сеансов)</p>
                  <p className="text-xs text-muted-foreground">28 покупок</p>
                </div>
                <div className="font-bold text-sm">38%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Премиум (15 сеансов)</p>
                  <p className="text-xs text-muted-foreground">14 покупок</p>
                </div>
                <div className="font-bold text-sm">19%</div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Средний чек диагностики</p>
                </div>
                <div className="text-2xl font-bold text-emerald-600">85 000 ₸</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiagnosticsDashboardPage;
