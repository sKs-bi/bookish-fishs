import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
    toasts: [],
    addToast: (message, type = 'info', duration = 3000) => {
        const id = ++toastId;
        const currentToasts = get().toasts;

        // 限制最多显示3条Toast
        const newToasts = currentToasts.length >= 3
            ? [...currentToasts.slice(1), { id, message, type, duration }]
            : [...currentToasts, { id, message, type, duration }];

        set({ toasts: newToasts });

        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id)
                }));
            }, duration);
        }
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    },
}));

export default useToastStore;
