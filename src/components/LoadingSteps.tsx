import { useEffect, useRef, useSyncExternalStore } from 'react';

interface LoadingStepsProps {
    isLoading: boolean;
}

const STEP_INTERVAL = 1500;
const STEPS = [
    'Initializing tracking system...',
    'Connecting to network towers...',
    'Triangulating signal...',
    'Fetching location data...'
];

// Custom hook to track elapsed time with periodic updates
function useStepProgress(isLoading: boolean): number {
    const startTimeRef = useRef<number | null>(null);

    // Reset start time when loading begins
    useEffect(() => {
        if (isLoading) {
            startTimeRef.current = Date.now();
        } else {
            startTimeRef.current = null;
        }
    }, [isLoading]);

    const subscribe = (callback: () => void) => {
        if (!isLoading) return () => {};
        const interval = setInterval(callback, STEP_INTERVAL);
        return () => clearInterval(interval);
    };

    const getSnapshot = () => {
        if (!isLoading || startTimeRef.current === null) return 0;
        const elapsed = Date.now() - startTimeRef.current;
        const step = Math.floor(elapsed / STEP_INTERVAL);
        return Math.min(step, STEPS.length - 1);
    };

    return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

export default function LoadingSteps({ isLoading }: LoadingStepsProps) {
    const currentStep = useStepProgress(isLoading);

    if (!isLoading) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl px-6 py-8 h-[350px] md:h-[300px]"
        >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8" />

            <div className="space-y-6">
                {STEPS.map((step, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-4 transition-all duration-300 ${index <= currentStep ? 'opacity-100' : 'opacity-40'
                            }`}
                    >
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 ${index < currentStep
                                ? 'bg-blue-500 text-white'
                                : index === currentStep
                                    ? 'bg-blue-500 text-white animate-pulse'
                                    : 'bg-blue-100 text-blue-400'
                                }`}
                        >
                            {index + 1}
                        </div>
                        <p
                            className={`text-base font-medium transition-all duration-300 ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                                }`}
                        >
                            {step}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
