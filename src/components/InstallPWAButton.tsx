import { useState, useEffect, useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

// Custom hook to check if app is installed
function useIsInstalled() {
    return useSyncExternalStore(
        (callback) => {
            const mediaQuery = window.matchMedia('(display-mode: standalone)');
            mediaQuery.addEventListener('change', callback);
            return () => mediaQuery.removeEventListener('change', callback);
        },
        () => {
            if (typeof window === 'undefined') return false;
            if (window.matchMedia('(display-mode: standalone)').matches) return true;
            // Check iOS standalone mode
            if ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
            return false;
        },
        () => false // Server snapshot
    );
}

export default function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const isInstalled = useIsInstalled();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isInstalled || !deferredPrompt) {
        return null;
    }

    return (
        <button
            onClick={handleInstallClick}
            className="w-full mt-3 bg-green-500 text-white py-4 rounded-2xl font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-3 shadow-lg text-base"
        >
            <Download className="w-5 h-5" />
            Install App
        </button>
    );
}
