export interface Patient {
    id: string;
    name: string;
    time: string;
    type: "Первичный" | "Повторный";
    complaint: string;
    notes: string;
}
