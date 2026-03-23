import React, { useRef, useImperativeHandle, forwardRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData, Question } from "../tabs/AdminDiagnosticTab";
import { DoctorFormData, DoctorQuestion } from "../tabs/DoctorDiagnosticTab";
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
    adminQuestions?: Question[];
    doctorQuestions?: DoctorQuestion[];
}

export const DiagnosticPdfExport = forwardRef<DiagnosticPdfExportRef, Props>(({ 
    lead, adminData, doctorData, prescriptionData, adminQuestions = [], doctorQuestions = [] 
}, ref) => {
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

    const renderDynamicAnswers = (questions: any[], answers: Record<string, any>) => {
        if (!questions.length) return null;
        return (
            <div className="grid grid-cols-1 gap-y-3 mt-4">
                {questions.map(q => {
                    const val = answers[q.id];
                    if (!val) return null;
                    return (
                        <div key={q.id} className="border-b border-gray-100 pb-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{q.label}</p>
                            <p className="text-sm font-medium whitespace-pre-wrap">{Array.isArray(val) ? val.join(", ") : val}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

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
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Ответы на вопросы</h3>
                        {renderDynamicAnswers(adminQuestions, adminData?.answers || {})}
                    </div>
                    
                    <div className="mt-8 border-t pt-4">
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Запись и оплата</h3>
                        <p>Назначено на: <strong>{adminData?.bookingDate?.toLocaleDateString()} в {adminData?.bookingTime}</strong></p>
                        <p>Врач: <strong>{adminData?.bookingDoctor}</strong></p>
                        <p>Статус оплаты: <strong>{adminData?.paymentStatus === "paid" ? "Оплачено" : "Ожидается"}</strong></p>
                        {adminData?.prepaymentAmount && <p>Сумма: <strong>{adminData.prepaymentAmount} ₸</strong></p>}
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
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Данные осмотра</h3>
                        {renderDynamicAnswers(doctorQuestions, doctorData?.answers || {})}
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
                            <h3 className="text-sm font-bold uppercase text-[#0060cf] mb-1">Рекомендация врача</h3>
                            <p className="font-bold text-lg">{doctorData?.recommendedCourse || "Не установлена"}</p>
                        </div>
                        <p>Готовность пациента: <strong>{
                            doctorData?.readiness === "ready" ? "✅ Готов начать" : 
                            doctorData?.readiness === "thinking" ? "🤔 Думает" : "❌ Не готов"
                        }</strong></p>
                        {doctorData?.refusalReason && <p>Причина отказа: <strong>{doctorData.refusalReason}</strong></p>}
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
                        <div className="w-full h-auto">
                            <InteractiveBodyMap selectedZones={prescriptionData?.selectedZones || []} onToggleZone={() => {}} isPrint={true} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold bg-secondary/20 p-2 rounded mb-2">Детали курса</h3>
                        <p>Старт: <strong>{prescriptionData?.startDate}</strong></p>
                        <p>Врач: <strong>{prescriptionData?.doctorName}</strong></p>
                        <p>Пакет: <strong>{doctorData?.recommendedCourse || "—"}</strong></p>
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
