import React, { useRef, useImperativeHandle, forwardRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData } from "../tabs/AdminDiagnosticTab";
import { DoctorFormData } from "../tabs/DoctorDiagnosticTab";
import { PrescriptionFormData } from "../tabs/PrescriptionTab";
import { InteractiveBodyMap } from "./InteractiveBodyMap";

export interface DiagnosticPdfExportRef {
    generatePdf: () => Promise<void>;
}

interface Props {
    lead: Lead;
    adminData: AdminFormData | null;
    doctorData: DoctorFormData | null;
    prescriptionData: PrescriptionFormData | null;
}

export const DiagnosticPdfExport = forwardRef<DiagnosticPdfExportRef, Props>(({ lead, adminData, doctorData, prescriptionData }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        generatePdf: async () => {
            if (!containerRef.current) return;
            const pdf = new jsPDF("p", "mm", "a4");
            const pages = containerRef.current.querySelectorAll(".pdf-page");

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;
                const canvas = await html2canvas(page, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL("image/png");
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            }
            pdf.save(`Диагностика_${lead.name}_${new Date().toLocaleDateString()}.pdf`);
        }
    }));

    // Элемент физически рендерится, но скрыт (мы спрячем его через CSS в родителе)
    // Размер А4: 210x297мм, что примерно 794x1123px при 96dpi. Поставим фиксированную ширину 794px.
    return (
        <div ref={containerRef} className="bg-white">
            
            {/* Страница 1: Анкета Администратора */}
            <div className="pdf-page w-[794px] min-h-[1123px] p-10 bg-white text-black text-sm relative box-border">
                <div className="border-b-2 border-primary/20 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0060cf]">Первичная Диагностика</h1>
                        <p className="text-muted-foreground mt-1">Отделение приема и регистрации</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">{lead.name}</p>
                        <p className="text-muted-foreground">{lead.phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Основная жалоба</h3>
                        <p className="pl-2 border-l-2 border-primary/20">{adminData?.complaints || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground">Локализация</h3>
                            <p>{adminData?.painLocation} {adminData?.painLocationOther}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground">Длительность</h3>
                            <p>{adminData?.painDuration || "—"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground">Характер боли</h3>
                            <p>{adminData?.painType || "—"}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-muted-foreground">Прошлое лечение</h3>
                            <p>{adminData?.previousTreatment || "—"}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Запись и оплата</h3>
                        <p>Назначено на: <strong>{adminData?.bookingDate?.toLocaleDateString()} в {adminData?.bookingTime}</strong></p>
                        <p>Врач: <strong>{adminData?.bookingDoctor}</strong></p>
                        <p>Статус оплаты: <strong>{adminData?.paymentStatus === "paid" ? "Оплачено" : "Ожидается"}</strong></p>
                        <p className="mt-2 text-xs text-muted-foreground">Комментарий админа: {adminData?.adminComment}</p>
                    </div>
                </div>
                
                <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs text-muted-foreground border-t pt-4">
                    <p>Подпись администратора _________________</p>
                    <p>Страница 1 из 3</p>
                </div>
            </div>

            {/* Страница 2: Анкета Врача */}
            <div className="pdf-page w-[794px] min-h-[1123px] p-10 bg-white text-black text-sm relative box-border">
                <div className="border-b-2 border-primary/20 pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0060cf]">Заключение Врача</h1>
                    <p className="text-muted-foreground mt-1">Осмотр и предварительный диагноз</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">1. Уточненные жалобы</h3>
                        <p className="font-medium whitespace-pre-wrap">{doctorData?.mainComplaint}</p>
                        <p className="text-xs text-muted-foreground mt-2">Триггеры: {doctorData?.triggers || "—"}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">2. Осмотр (визуально и пальпация)</h3>
                        <p><strong>Визуально:</strong> {doctorData?.visualExam || "—"}</p>
                        <p className="mt-2"><strong>Пальпация:</strong> {doctorData?.palpation || "—"}</p>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <h3 className="text-sm font-bold uppercase text-[#0060cf] mb-1">Предварительный диагноз</h3>
                        <p className="font-bold text-lg">{doctorData?.preliminaryDiagnosis || "Не установлен"}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">3. Первая процедура</h3>
                        <p>Вид: <strong>{doctorData?.procedureType || "—"}</strong></p>
                        <p>Реакция: {doctorData?.procedureReaction || "—"}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">4. Рекомендация врача</h3>
                        <p><strong>Пакет:</strong> {doctorData?.recommendedCourse || "—"}</p>
                        <p className="mt-2 text-xs">Комментарий: {doctorData?.conclusion}</p>
                    </div>
                </div>

                <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs text-muted-foreground border-t pt-4">
                    <p>Подпись врача _________________</p>
                    <p>Страница 2 из 3</p>
                </div>
            </div>

            {/* Страница 3: Лист назначения */}
            <div className="pdf-page w-[794px] min-h-[1123px] p-10 bg-white text-black text-sm relative box-border">
                <div className="border-b-2 border-primary/20 pb-4 mb-6 text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0060cf]">Лист Назначения</h1>
                    <p className="text-muted-foreground mt-1">План лечения пациента {lead.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-4">Зоны лечения</h3>
                        {/* Interactive Body Map is rendered as static SVG here */}
                        <div className="scale-[0.6] origin-top-left -mt-4">
                            <InteractiveBodyMap selectedZones={prescriptionData?.selectedZones || []} onToggleZone={() => {}} isPrint={true} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Детали курса</h3>
                        <p>Старт: <strong>{prescriptionData?.startDate}</strong></p>
                        <p>Врач: <strong>{prescriptionData?.doctorName}</strong></p>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-4">Расписание визитов</h3>
                    <table className="w-full text-left border-collapse border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 w-10 text-center">№</th>
                                <th className="border p-2">Дата</th>
                                <th className="border p-2">Время</th>
                                <th className="border p-2">Процедура</th>
                                <th className="border p-2 w-16 text-center">Каб.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prescriptionData?.schedule || []).map((row, i) => (
                                <tr key={i}>
                                    <td className="border p-2 text-center text-gray-500">{i + 1}</td>
                                    <td className="border p-2">{row.date}</td>
                                    <td className="border p-2">{row.time}</td>
                                    <td className="border p-2">{row.procedure}</td>
                                    <td className="border p-2 text-center">{row.room}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="absolute bottom-20 left-10 space-y-4 text-xs">
                    <p>С планом лечения ознакомлен, противопоказаний не имею.</p>
                    <p>Подпись пациента _________________</p>
                </div>
                <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs text-muted-foreground border-t pt-4">
                    <p>Лечащий врач _________________</p>
                    <p>Страница 3 из 3</p>
                </div>
            </div>

        </div>
    );
});

DiagnosticPdfExport.displayName = "DiagnosticPdfExport";
