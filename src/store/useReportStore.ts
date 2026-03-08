import { create } from 'zustand';

interface ReportStore {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
