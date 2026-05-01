export type LeadStageValue =
  | "new"
  | "contacted"
  | "negotiating"
  | "offer_made"
  | "accepted"
  | "rejected"
  | "lost";

export type LeadStageMeta = {
  value: LeadStageValue;
  label: string;
  dot: string;
};

export const LEAD_STAGES: LeadStageMeta[] = [
  { value: "new", label: "جديد", dot: "bg-sky-500" },
  { value: "contacted", label: "تم التواصل", dot: "bg-indigo-500" },
  { value: "negotiating", label: "تفاوض", dot: "bg-violet-500" },
  { value: "offer_made", label: "عرض مقدّم", dot: "bg-amber-500" },
  { value: "accepted", label: "مقبول", dot: "bg-emerald-500" },
  { value: "rejected", label: "مرفوض", dot: "bg-rose-500" },
  { value: "lost", label: "خسارة", dot: "bg-red-600" },
];

export function getLeadStageLabel(stage: string) {
  return LEAD_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function getLeadStage(lead: { negotiation_status?: string; stage?: string }) {
  return lead.negotiation_status ?? lead.stage ?? "new";
}
