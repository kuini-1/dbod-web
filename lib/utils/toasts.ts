// Toast utilities using react-hot-toast
import toast from 'react-hot-toast';

export const SuccessToast = {
    fire: (message: string) => {
        toast.success(message, {
            duration: 4000,
            position: 'top-center',
        });
    }
};

export const WarningToast = {
    fire: (message: string) => {
        toast(message, {
            icon: '⚠️',
            duration: 4000,
            position: 'top-center',
        });
    }
};

export const DangerToast = {
    fire: (message: string) => {
        toast.error(message, {
            duration: 4000,
            position: 'top-center',
        });
    }
};
