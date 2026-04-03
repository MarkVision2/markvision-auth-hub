import React, { useRef, useImperativeHandle, forwardRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Lead } from "../../crm/KanbanBoard";
import { AdminFormData, Question } from "../tabs/AdminDiagnosticTab";
import { TherapistFormData, TherapistQuestion } from "../tabs/TherapistDiagnosticTab";
import { RehabFormData } from "../tabs/RehabDiagnosticTab";
import { TreatmentPlanFormData } from "../tabs/TreatmentPlanTab";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
                // Temporarily ensure high quality
                const canvas = await html2canvas(page, { 
                    scale: 3, 
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false
                });
                const imgData = canvas.toDataURL("image/png", 1.0);
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            }
            pdf.save(`Карточка_пациента_${lead.name}_${new Date().toLocaleDateString()}.pdf`);
        }
    }));

    const renderDynamicAnswers = (questions: any[], answers: Record<string, any>) => {
        if (!questions.length) return <p className="text-gray-400 italic text-xs">Информация отсутствует</p>;
        
        const answeredQuestions = questions.filter(q => {
            const val = answers[q.id];
            return val !== undefined && val !== null && val !== "";
        });

        if (answeredQuestions.length === 0) return <p className="text-gray-400 italic text-xs">Информация отсутствует</p>;

        return (
            <div className="flex flex-col border-t border-gray-200 mt-4">
                {answeredQuestions.map((q, idx) => {
                    const val = answers[q.id];
                    
                    const getOptionLabel = (id: string) => {
                        const opt = q.options?.find((o: any) => o.id === id);
                        return opt ? opt.label : id;
                    };

                    let displayValue = val;
                    if (Array.isArray(val)) {
                        displayValue = val.map(getOptionLabel).join(", ");
                    } else if (q.options && q.options.length > 0) {
                        displayValue = getOptionLabel(val);
                    }

                    return (
                        <div key={q.id} className={idx % 2 === 0 ? "bg-gray-50/50 p-4 border-b border-gray-100" : "bg-white p-4 border-b border-gray-100"}>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1.5">{q.label}</p>
                            <p className="text-[13px] font-semibold text-black leading-relaxed whitespace-pre-wrap">{displayValue}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

    const header = (
        <div className="border-b-2 border-black pb-8 mb-8 flex justify-between items-start w-full">
            <div className="space-y-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black uppercase tracking-tight text-black">КАРТОЧКА ПАЦИЕНТА</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[9px] border-l-2 border-black pl-3 ml-1">MarkVision Clinic / Medical Report</p>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1 pt-2">
                    <div>
                        <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">ФИО ПАЦИЕНТА</p>
                        <p className="text-sm font-black uppercase">{lead.name}</p>
                    </div>
                    <div>
                        <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">НОМЕР ТЕЛЕФОНА</p>
                        <p className="text-sm font-black">{lead.phone || "—"}</p>
                    </div>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <div className="bg-black text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest mb-3">
                    ID: {lead.id.slice(0, 8)}
                </div>
                <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mb-1">ДАТА ФОРМИРОВАНИЯ</p>
                <p className="text-sm font-black uppercase">{format(new Date(), "dd MMMM yyyy", { locale: ru })}</p>
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="bg-[#f0f0f0]">
            
            {/* Страница 1: Админ Диагностика */}
            <div className="pdf-page w-[842px] min-h-[1191px] p-[60px] bg-white text-black text-sm relative box-border mx-auto shadow-2xl mb-10 overflow-hidden">
                {header}

                <div className="space-y-6">
                    <div className="bg-white border-2 border-black rounded-3xl overflow-hidden">
                        <div className="bg-black p-4">
                            <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-2 w-2 bg-white rounded-full" />
                                I. ПЕРВИЧНАЯ ДИАГНОСТИКА И АНАМНЕЗ
                            </h3>
                        </div>
                        {renderDynamicAnswers(adminQuestions, adminData?.answers || {})}
                    </div>

                    {adminData?.adminComment && (
                        <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Заключение администратора / жалобы</p>
                            <p className="text-sm font-bold leading-relaxed">{adminData.adminComment}</p>
                        </div>
                    )}
                </div>
                
                <div className="absolute bottom-12 left-[60px] right-[60px] flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-widest border-t-2 border-gray-100 pt-8">
                    <p>MarkVision Medical System // Confidential</p>
                    <p>ЛИСТ 01 // 03</p>
                </div>
            </div>

            {/* Страница 2: Осмотр Врачей */}
            <div className="pdf-page w-[842px] min-h-[1191px] p-[60px] bg-white text-black text-sm relative box-border mx-auto shadow-2xl mb-10 overflow-hidden">
                <div className="border-b-2 border-black pb-8 mb-8">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-black">ОСМОТР СПЕЦИАЛИСТОВ</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[9px] border-l-2 border-black pl-3 ml-1">Clinical Assessment & Examination</p>
                </div>

                <div className="space-y-10">
                    <div className="bg-white border-2 border-black rounded-3xl overflow-hidden">
                        <div className="bg-black p-4">
                            <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-2 w-2 bg-emerald-400 rounded-full" />
                                II. ОСМОТР ТЕРАПЕВТА
                            </h3>
                        </div>
                        {renderDynamicAnswers(therapistQuestions, therapistData?.answers || {})}
                    </div>

                    <div className="bg-white border-2 border-black rounded-3xl overflow-hidden">
                        <div className="bg-black p-4">
                            <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="h-2 w-2 bg-indigo-400 rounded-full" />
                                III. ТЕСТЫ РЕАБИЛИТОЛОГА
                            </h3>
                        </div>
                        <div className="p-0">
                            {rehabData ? (
                                <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
                                    <div className="p-6 border-r border-b border-gray-100 bg-gray-50/30">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Мобильность (0-10)</p>
                                        <p className="text-xl font-black">{rehabData.jointMobility} / 10</p>
                                    </div>
                                    <div className="p-6 border-b border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Болевой порог (0-10)</p>
                                        <p className="text-xl font-black text-rose-600">{rehabData.painOnLoad} / 10</p>
                                    </div>
                                    <div className="p-6 border-r border-gray-100 bg-white">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">МЫШЕЧНЫЙ БАЛАНС</p>
                                        <p className="text-sm font-bold uppercase">{rehabData.muscleBalance || "—"}</p>
                                    </div>
                                    <div className="p-6 bg-gray-50/30">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">СТАБИЛИЗАЦИЯ</p>
                                        <p className="text-sm font-bold uppercase">{rehabData.spineStabilization || "—"}</p>
                                    </div>
                                    <div className="col-span-2 p-6 bg-rose-50/30 border-t border-gray-200">
                                        <p className="text-[10px] text-rose-600 font-black uppercase mb-1 tracking-widest">ПРОТИВОПОКАЗАНИЯ И ОГРАНИЧЕНИЯ</p>
                                        <p className="text-sm font-black text-rose-900">{rehabData.restrictions || "НЕ ВЫЯВЛЕНО"}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="p-8 text-gray-400 italic text-xs">Данные отсутствуют</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="absolute bottom-12 left-[60px] right-[60px] flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-widest border-t-2 border-gray-100 pt-8">
                    <p>MarkVision Medical System // Evaluation Section</p>
                    <p>ЛИСТ 02 // 03</p>
                </div>
            </div>

            {/* Страница 3: План Лечения (Лист Назначения) */}
            <div className="pdf-page w-[842px] min-h-[1191px] p-[60px] bg-white text-black text-sm relative box-border mx-auto shadow-2xl overflow-hidden">
                <div className="border-b-2 border-black pb-8 mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-black">ЛИСТ НАЗНАЧЕНИЙ</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[9px] border-l-2 border-black pl-3 ml-1">Prescription Sheet & Treatment Plan</p>
                    </div>
                    <div className="text-right">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] text-gray-400 uppercase font-black mb-1">Номер документа</p>
                            <p className="text-xs font-black">MV-{lead.id.slice(0,6).toUpperCase()}-2024</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {treatmentPlanData ? (
                        <div className="bg-white border-2 border-black rounded-[40px] overflow-hidden">
                            <div className="bg-black p-6 flex justify-between items-center">
                                <h3 className="text-white text-lg font-black uppercase tracking-widest">ПРОГРАММА ЛЕЧЕНИЯ</h3>
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-black font-black text-sm">4</span>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-12 border-b-2 border-black pb-4">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-1">КУРС ЛЕЧЕНИЯ</p>
                                        <p className="text-2xl font-black text-black uppercase tracking-tight">{treatmentPlanData.course || "ПРОТОКОЛ НЕ УКАЗАН"}</p>
                                    </div>
                                    
                                    <div className="col-span-4 p-6 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-2">КОЛИЧЕСТВО СЕАНСОВ</p>
                                        <p className="text-2xl font-black">{treatmentPlanData.count} <span className="text-xs font-bold text-gray-400">ЗАНЯТИЙ</span></p>
                                    </div>
                                    
                                    <div className="col-span-4 p-6 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-2">ДАТА НАЧАЛА</p>
                                        <p className="text-2xl font-black uppercase">{treatmentPlanData.startDate}</p>
                                    </div>

                                    <div className="col-span-4 p-6 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-2">СПЕЦИАЛИСТ</p>
                                        <p className="text-sm font-black uppercase">{treatmentPlanData.specialist || "НЕ НАЗНАЧЕН"}</p>
                                    </div>

                                    <div className="col-span-12 p-8 border-2 border-black rounded-3xl">
                                        <p className="text-[10px] text-gray-400 uppercase font-black mb-2">ГРАФИК И ПОРЯДОК ПОСЕЩЕНИЙ</p>
                                        <p className="text-lg font-bold text-black leading-relaxed italic">{treatmentPlanData.schedule || "ИНДИВИДУАЛЬНО СОГЛАСНО РАСПИСАНИЮ"}</p>
                                    </div>
                                </div>

                                <div className="p-10 bg-indigo-50 border-2 border-indigo-600 rounded-[48px] shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <svg width="100" height="100" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
                                        </svg>
                                    </div>
                                    <p className="text-[12px] text-indigo-600 font-black uppercase mb-3 tracking-[0.2em] text-center">ИТОГОВОЕ ЗАКЛЮЧЕНИЕ КОНСИЛИУМА</p>
                                    <p className="text-xl font-black text-indigo-900 leading-tight text-center whitespace-pre-wrap uppercase tracking-tight italic">"{treatmentPlanData.finalConclusion || "РЕКОМЕНДОВАНО К ВЫПОЛНЕНИЮ"}"</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 border-4 border-dashed border-gray-100 rounded-[50px] text-center">
                            <p className="text-gray-300 font-black uppercase tracking-widest">План лечения не сформирован</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-20 pt-16 px-10">
                        <div className="space-y-12">
                            <div className="border-t-2 border-black pt-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">ПАЦИЕНТ</p>
                                <p className="text-[12px] font-black uppercase leading-none">{lead.name}</p>
                                <div className="h-20" />
                                <p className="text-[10px] font-bold text-gray-300 italic">Подпись и дата</p>
                            </div>
                        </div>
                        <div className="space-y-12">
                            <div className="border-t-2 border-black pt-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">МЕДИЦИНСКИЙ СПЕЦИАЛИСТ</p>
                                <p className="text-[12px] font-black uppercase leading-none">{treatmentPlanData?.specialist || lead.doctor_name || "_________________"}</p>
                                <div className="h-20" />
                                <p className="text-[10px] font-bold text-gray-300 italic">Подпись и личная печать</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="absolute bottom-12 left-[60px] right-[60px] flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-widest border-t-2 border-gray-100 pt-8">
                    <p>MarkVision Medical System // Prescription Master</p>
                    <p>ЛИСТ 03 // 03</p>
                </div>
            </div>

        </div>
    );
});

DiagnosticPdfExport.displayName = "DiagnosticPdfExport";
