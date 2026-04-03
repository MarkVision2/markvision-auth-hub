import React, { useRef, useImperativeHandle, forwardRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData, Question } from "../tabs/AdminDiagnosticTab";
import { TherapistFormData, TherapistQuestion } from "../tabs/TherapistDiagnosticTab";
import { RehabFormData } from "../tabs/RehabDiagnosticTab";
import { TreatmentPlanFormData } from "../tabs/TreatmentPlanTab";

export interface DiagnosticPdfExportRef {
    generatePdf: () => Promise<void>;
}

interface Props {
    lead: Lead;
    adminData: AdminFormData | null;
    therapistData: TherapistFormData | null;
    rehabData: RehabFormData | null;
    treatmentPlanData: TreatmentPlanFormData | null;
    adminQuestions?: Question[];
    therapistQuestions?: TherapistQuestion[];
}

export const DiagnosticPdfExport = forwardRef<DiagnosticPdfExportRef, Props>(({ 
    lead, adminData, therapistData, rehabData, treatmentPlanData, adminQuestions = [], therapistQuestions = [] 
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        generatePdf: async () => {
            if (!containerRef.current) return;
            const pdf = new jsPDF("p", "mm", "a4");
            const pages = containerRef.current.querySelectorAll(".pdf-page");

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;
                // Temporary remove hidden class for capture
                page.style.display = 'block';
                const canvas = await html2canvas(page, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL("image/png");
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            }
            pdf.save(`Консилиум_${lead.name}_${new Date().toLocaleDateString()}.pdf`);
        }
    }));

    const renderDynamicAnswers = (questions: any[], answers: Record<string, any>) => {
        if (!questions.length) return <p className="text-gray-400 italic text-xs">Нет данных</p>;
        return (
            <div className="grid grid-cols-1 gap-y-3 mt-4">
                {questions.map(q => {
                    const val = answers[q.id];
                    if (!val) return null;
                    return (
                        <div key={q.id} className="border-b border-gray-100 pb-2">
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{q.label}</p>
                            <p className="text-sm font-bold whitespace-pre-wrap">{Array.isArray(val) ? val.join(", ") : val}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div ref={containerRef} className="bg-white">
            
            {/* Страница 1: Админ + Терапевт */}
            <div className="pdf-page w-[794px] min-h-[1123px] p-12 bg-white text-black text-sm relative box-border">
                <div className="border-b-4 border-[#0060cf] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-[#0060cf]">Diagnostic Report</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Medical Case & Examination</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black">{lead.name}</p>
                        <p className="text-gray-500 font-bold">{lead.phone}</p>
                        <p className="text-[10px] font-black text-[#0060cf] mt-2 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest inline-block">ID: {lead.id.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Stage 1: Admin */}
                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-2 w-8 bg-[#0060cf] rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Этап 1: Первичная регистрация</h3>
                        </div>
                        {renderDynamicAnswers(adminQuestions, adminData?.answers || {})}
                        {adminData?.adminComment && (
                            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl italic text-xs font-bold">
                                "{adminData.adminComment}"
                            </div>
                        )}
                    </div>
                    
                    {/* Stage 2: Therapist */}
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-2 w-8 bg-emerald-500 rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Этап 2: Осмотр терапевта</h3>
                        </div>
                        {renderDynamicAnswers(therapistQuestions, therapistData?.answers || {})}
                    </div>
                </div>
                
                <div className="absolute bottom-10 left-12 right-12 flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest border-t pt-6">
                    <p>Signature _________________</p>
                    <p>Page 01 // 02</p>
                </div>
            </div>

            {/* Страница 2: Реабилитолог + План */}
            <div className="pdf-page w-[794px] min-h-[1123px] p-12 bg-white text-black text-sm relative box-border">
                <div className="border-b-4 border-[#0060cf] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-[#0060cf]">Recovery Plan</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Functional Assessment & Strategy</p>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Stage 3: Rehab */}
                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-2 w-8 bg-indigo-500 rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Этап 3: Тесты реабилитолога</h3>
                        </div>
                        {rehabData ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Мобильность</p>
                                    <p className="text-sm font-bold">Суставы: {rehabData.jointMobility} / 10</p>
                                    <p className="text-sm font-bold">Мышечный баланс: {rehabData.muscleBalance}</p>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Болевой синдром</p>
                                    <p className="text-sm font-bold">Боль при нагрузке: {rehabData.painOnLoad} / 10</p>
                                    <p className="text-sm font-bold">Стабильность: {rehabData.spineStabilization}</p>
                                </div>
                                <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Противопоказания и ограничения</p>
                                    <p className="text-sm font-bold text-rose-600">{rehabData.restrictions || "Нет"}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-xs">Данные отсутствуют</p>
                        )}
                    </div>

                    {/* Stage 4: Treatment Plan */}
                    <div className="p-6 bg-[#0060cf]/5 rounded-[32px] border border-[#0060cf]/10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-2 w-8 bg-[#0060cf] rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Этап 4: План лечения</h3>
                        </div>
                        {treatmentPlanData ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold">Курс лечения</p>
                                            <p className="text-lg font-black text-[#0060cf]">{treatmentPlanData.course || "—"}</p>
                                        </div>
                                        <div className="flex gap-10">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Занятий</p>
                                                <p className="text-sm font-black">{treatmentPlanData.count}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Старт</p>
                                                <p className="text-sm font-black">{treatmentPlanData.startDate}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold">График</p>
                                            <p className="text-sm font-bold whitespace-pre-wrap">{treatmentPlanData.schedule || "По договоренности"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold">Специалист</p>
                                            <p className="text-sm font-black">{treatmentPlanData.specialist || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-6 border-t border-blue-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Итоговое заключение консилиума</p>
                                    <p className="text-sm font-bold leading-relaxed">{treatmentPlanData.finalConclusion || "Рекомендовано наблюдение и выполнение назначенного курса."}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-xs">План не сформирован</p>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-20 left-12 space-y-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l-2 border-gray-100 pl-6">
                    <p>С планом лечения ознакомлен, противопоказаний не имею.</p>
                    <p>Пациент: _________________ / {lead.name} /</p>
                </div>
                
                <div className="absolute bottom-10 left-12 right-12 flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest border-t pt-6">
                    <p>Physician Signature _________________</p>
                    <p>Page 02 // 02</p>
                </div>
            </div>

        </div>
    );
});

DiagnosticPdfExport.displayName = "DiagnosticPdfExport";
