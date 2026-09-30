import { create } from "zustand";

export const useOrderModal = create((set) => ({
  isOpen: false,
  order: null,

  openModal: (order) =>
    set({
      isOpen: true,
      order,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      order: null,
    }),
}));
