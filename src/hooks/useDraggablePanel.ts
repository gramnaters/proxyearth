import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export type PanelPosition = 'minimized' | 'half' | 'full';

interface UseDraggablePanelProps {
    onPositionChange?: (position: PanelPosition) => void;
}

const DRAG_THRESHOLD = 10;

export function useDraggablePanel({ onPositionChange }: UseDraggablePanelProps = {}) {
    const [position, setPosition] = useState<PanelPosition>('half');
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    const startY = useRef(0);
    const currentTranslate = useRef(0);

    const snapPositions = useMemo(() => ({
        minimized: typeof window !== 'undefined' ? window.innerHeight * 0.80 : 0,
        half: typeof window !== 'undefined' ? window.innerHeight * 0.45 : 0,
        full: 0
    }), []);

    const getSnapPosition = useCallback((translateY: number): PanelPosition => {
        const positions = [
            { name: 'full' as PanelPosition, value: snapPositions.full },
            { name: 'half' as PanelPosition, value: snapPositions.half },
            { name: 'minimized' as PanelPosition, value: snapPositions.minimized }
        ];

        let closest = positions[0];
        let minDiff = Math.abs(translateY - positions[0].value);

        positions.forEach(pos => {
            const diff = Math.abs(translateY - pos.value);
            if (diff < minDiff) {
                minDiff = diff;
                closest = pos;
            }
        });

        return closest.name;
    }, [snapPositions.full, snapPositions.half, snapPositions.minimized]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        currentTranslate.current = snapPositions[position];
        setHasMoved(false);
    }, [position, snapPositions]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        startY.current = e.clientY;
        currentTranslate.current = snapPositions[position];
        setHasMoved(false);
        setIsDragging(true);
    }, [position, snapPositions]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (Math.abs(diff) > DRAG_THRESHOLD) {
            if (!hasMoved) {
                setHasMoved(true);
                setIsDragging(true);
            }
        }

        if (hasMoved || Math.abs(diff) > DRAG_THRESHOLD) {
            const newTranslate = Math.max(0, Math.min(currentTranslate.current + diff, snapPositions.minimized));
            setDragOffset(newTranslate);
        }
    }, [snapPositions.minimized, hasMoved]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const currentY = e.clientY;
        const diff = currentY - startY.current;

        if (Math.abs(diff) > DRAG_THRESHOLD) {
            setHasMoved(true);
        }

        if (hasMoved || Math.abs(diff) > DRAG_THRESHOLD) {
            const newTranslate = Math.max(0, Math.min(currentTranslate.current + diff, snapPositions.minimized));
            setDragOffset(newTranslate);
        }
    }, [isDragging, snapPositions.minimized, hasMoved]);

    const handleEnd = useCallback(() => {
        if (!isDragging && !hasMoved) return;

        setIsDragging(false);

        if (hasMoved) {
            const newPosition = getSnapPosition(dragOffset);
            setPosition(newPosition);
            setDragOffset(0);

            if (onPositionChange) {
                onPositionChange(newPosition);
            }
        }

        setHasMoved(false);
    }, [isDragging, dragOffset, getSnapPosition, onPositionChange, hasMoved]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleEnd);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleEnd);
            };
        }
    }, [isDragging, handleMouseMove, handleEnd]);

    const translateY = useMemo(() => {
        if (isDragging && hasMoved) {
            return dragOffset;
        }
        return snapPositions[position];
    }, [isDragging, hasMoved, dragOffset, position, snapPositions]);

    const setPositionManually = useCallback((newPosition: PanelPosition) => {
        setPosition(newPosition);
        if (onPositionChange) {
            onPositionChange(newPosition);
        }
    }, [onPositionChange]);

    return {
        position,
        setPosition: setPositionManually,
        isDragging,
        translateY,
        handlers: {
            onTouchStart: handleTouchStart,
            onMouseDown: handleMouseDown,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleEnd,
        }
    };
}
