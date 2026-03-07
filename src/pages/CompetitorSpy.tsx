import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, Sparkles, Radio } from "lucide-react";
import { CompetitorAdCard, type MockAd } from "@/components/spy/CompetitorAdCard";
import { AiRebuildSheet } from "@/components/spy/AiRebuildSheet";

const MOCK_ADS: MockAd[] = [
  {
    id: "1",
    advertiser: "AIVA Clinic",
    avatar: "AC",
    activeSince: "12 Марта",
    media: "4:5",
    copy: "Ставим брекеты недорого! Звоните по телефону и запишитесь на бесплатную консультацию. Наши специалисты помогут вам выбрать идеальный вариант лечения для вашей улыбки.",
    platform: "Instagram",
    weaknesses: ["Нет призыва к действию", "Слабый заголовок", "Нет оффера"],
    improved: "🔥 Мечтаете об идеальной улыбке, но пугают цены?\n\nВ AIVA Clinic мы ставим премиум-элайнеры с рассрочкой 0-0-12. Без переплат.\n\n✅ Бесплатная 3D-диагностика\n✅ План лечения за 1 визит\n✅ Гарантия результата в договоре\n\n📲 Напишите «УЛЫБКА» в Direct — и получите персональный расчёт за 2 минуты.",
    suggestedFormat: "Instagram Reels",
  },
  {
    id: "2",
    advertiser: "BeautyLab Moscow",
    avatar: "BL",
    activeSince: "5 Марта",
    media: "9:16",
    copy: "Лазерная эпиляция от 990 рублей. Акция до конца месяца! Приходите к нам в салон, адрес: ул. Тверская, 15. Работаем без выходных.",
    platform: "Instagram",
    weaknesses: ["Нет уникальности", "Слабый CTA", "Нет социального доказательства"],
    improved: "💎 Гладкая кожа навсегда — без боли и раздражений\n\nЛазерная эпиляция нового поколения в BeautyLab:\n\n🔬 Диодный лазер последнего поколения\n⭐ 4.9 на Яндекс Картах (2,300+ отзывов)\n💰 Первая зона — 990₽ (экономия 60%)\n\nЗаписывайтесь сейчас → ссылка в шапке профиля\n⏰ Осталось 12 мест по акции",
    suggestedFormat: "Stories + Reels",
  },
  {
    id: "3",
    advertiser: "FitPro Academy",
    avatar: "FP",
    activeSince: "1 Марта",
    media: "4:5",
    copy: "Фитнес тренировки онлайн. Программы для похудения и набора массы. Опытные тренеры. Первая тренировка бесплатно.",
    platform: "Facebook",
    weaknesses: ["Общие фразы", "Нет конкретики", "Нет эмоций"],
    improved: "🏋️ Минус 8 кг за 8 недель — или вернём деньги\n\nПерсональная программа от тренеров, которые подготовили 500+ трансформаций:\n\n📊 AI-подбор питания под ваш метаболизм\n🎥 Живые тренировки 5 дней в неделю\n📱 Поддержка в чате 24/7\n\nПервая неделя — 0₽. Жмите «Подробнее» 👇",
    suggestedFormat: "Carousel 7 slides",
  },
  {
    id: "4",
    advertiser: "Digital School Pro",
    avatar: "DS",
    activeSince: "28 Февраля",
    media: "9:16",
    copy: "Курсы по маркетингу. Научим настраивать рекламу в Instagram и Facebook. Диплом по окончании. Записывайтесь!",
    platform: "Instagram",
    weaknesses: ["Нет результата", "Нет дедлайна", "Скучный формат"],
    improved: "📈 С 0 до 150К/мес на фрилансе за 3 месяца\n\nЭто не мотивашка — это статистика наших выпускников:\n\n💼 87% находят первого клиента ещё во время обучения\n🧠 Практика на реальных бюджетах (не тесты!)\n🎓 Сертификат Meta Blueprint\n\n🔥 Старт потока — 15 марта. Осталось 8 мест.\n\n→ Пройдите бесплатный тест на готовность",
    suggestedFormat: "Instagram Reels",
  },
  {
    id: "5",
    advertiser: "AutoDetailing VIP",
    avatar: "AD",
    activeSince: "10 Марта",
    media: "4:5",
    copy: "Детейлинг автомобилей. Полировка, керамика, химчистка салона. Качественно и быстро. Звоните!",
    platform: "Instagram",
    weaknesses: ["Нет визуала до/после", "Нет гарантий", "Безликий текст"],
    improved: "🚗 Ваш автомобиль будет выглядеть дороже на 30%\n\nПремиум-детейлинг с гарантией 2 года:\n\n✨ Керамика Gyeon Q² Mohs+ (топ-1 в мире)\n📸 Фотоотчёт до/после каждого этапа\n🏆 Обслуживаем 40+ автомобилей премиум-класса в месяц\n\n📲 Отправьте фото авто в Direct — рассчитаем стоимость за 5 минут",
    suggestedFormat: "Carousel Before/After",
  },
  {
    id: "6",
    advertiser: "SmartHome Solutions",
    avatar: "SH",
    activeSince: "7 Марта",
    media: "9:16",
    copy: "Умный дом под ключ. Установка систем автоматизации. Работаем по всей Москве.",
    platform: "Facebook",
    weaknesses: ["Нет выгоды для клиента", "Нет цены/оффера", "Холодный тон"],
    improved: "🏠 Представьте: вы говорите «Алиса, я дома» — и всё включается\n\nУмный дом от SmartHome за 3 дня:\n\n🎛 Свет, климат, безопасность — одно приложение\n💡 Экономия на электричестве до 40%\n🔧 Установка без ремонта и пыли\n\nБесплатный выезд инженера + 3D-проект в подарок 🎁\n\n👉 Оставьте заявку — перезвоним за 15 минут",
    suggestedFormat: "Instagram Reels",
  },
];

export default function CompetitorSpy() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "monitoring">("results");
  const [selectedAd, setSelectedAd] = useState<MockAd | null>(null);
  const [monitoringIds, setMonitoringIds] = useState<string[]>([]);

  const toggleMonitoring = (id: string) => {
    setMonitoringIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const displayAds = activeTab === "monitoring"
    ? MOCK_ADS.filter((a) => monitoringIds.includes(a.id))
    : MOCK_ADS;

  return (
    <DashboardLayout breadcrumb="Радар конкурентов">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Радар конкурентов</h1>
            <p className="text-xs text-muted-foreground">Анализ рекламы · Разбор офферов · AI-реконструкция</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Введите Instagram ник или название страницы (например, @aivaclinic)..."
                className="pl-11 h-12 bg-card/50 border-border/50 text-sm rounded-xl backdrop-blur-sm focus-visible:ring-primary/30"
              />
            </div>
            <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              <Search className="h-4 w-4 mr-2" />
              Найти
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card/30 border border-border/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === "results"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Результаты поиска
          </button>
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === "monitoring"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Мой мониторинг ({monitoringIds.length})
          </button>
        </div>

        {/* Ad Grid */}
        {displayAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Eye className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Нет объявлений в мониторинге</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayAds.map((ad) => (
              <CompetitorAdCard
                key={ad.id}
                ad={ad}
                isMonitored={monitoringIds.includes(ad.id)}
                onToggleMonitor={() => toggleMonitoring(ad.id)}
                onRebuild={() => setSelectedAd(ad)}
              />
            ))}
          </div>
        )}
      </div>

      <AiRebuildSheet ad={selectedAd} onClose={() => setSelectedAd(null)} />
    </DashboardLayout>
  );
}
