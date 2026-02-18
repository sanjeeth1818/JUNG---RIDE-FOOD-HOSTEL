import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

const SlideToStart = ({ onComplete, text = "Slide to Start Trip" }) => {
    const [slidePosition, setSlidePosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const containerRef = useRef(null);
    const THRESHOLD = 0.85; // 85% slide to complete

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDrag = (event, info) => {
        if (!containerRef.current || isCompleted) return;
        const containerWidth = containerRef.current.offsetWidth;
        const buttonWidth = 60;
        const maxSlide = containerWidth - buttonWidth;

        const newPosition = Math.max(0, Math.min(info.point.x - buttonWidth / 2, maxSlide));
        setSlidePosition(newPosition);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (!containerRef.current || isCompleted) return;

        const containerWidth = containerRef.current.offsetWidth;
        const buttonWidth = 60;
        const maxSlide = containerWidth - buttonWidth;
        const progress = slidePosition / maxSlide;

        if (progress >= THRESHOLD) {
            // Success! Complete the action
            setSlidePosition(maxSlide);
            setIsCompleted(true);

            // Haptic-like feedback with animation
            setTimeout(() => {
                onComplete();
                // Reset after completion
                setTimeout(() => {
                    setIsCompleted(false);
                    setSlidePosition(0);
                }, 500);
            }, 300);
        } else {
            // Reset with bounce animation
            setSlidePosition(0);
        }
    };

    const progress = containerRef.current
        ? slidePosition / (containerRef.current.offsetWidth - 60)
        : 0;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: 60,
                background: isCompleted ? '#10b981' : '#f3f4f6',
                borderRadius: 30,
                overflow: 'hidden',
                userSelect: 'none',
                touchAction: 'none',
                transition: 'background 0.3s ease'
            }}
        >
            {/* Progress Background with Gradient */}
            <motion.div
                animate={{
                    width: `${progress * 100}%`,
                    opacity: isCompleted ? 1 : 0.9
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    background: isCompleted
                        ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                    borderRadius: 30
                }}
            />

            {/* Shimmer Effect */}
            {!isCompleted && progress > 0.3 && (
                <motion.div
                    animate={{
                        x: ['-100%', '200%']
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '30%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        pointerEvents: 'none'
                    }}
                />
            )}

            {/* Text with Animation */}
            <AnimatePresence mode="wait">
                {!isCompleted ? (
                    <motion.div
                        key="text"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 16,
                            color: progress > 0.3 ? 'white' : '#6b7280',
                            transition: 'color 0.2s',
                            pointerEvents: 'none',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {text}
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: 16,
                            gap: 8
                        }}
                    >
                        <Check size={24} strokeWidth={3} />
                        <span>CONFIRMED</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Draggable Button with Enhanced Styling */}
            <motion.div
                drag="x"
                dragConstraints={containerRef}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{
                    x: slidePosition,
                    scale: isCompleted ? 0.9 : (isDragging ? 0.95 : 1)
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 60,
                    height: 60,
                    background: isCompleted ? '#10b981' : 'white',
                    borderRadius: 30,
                    boxShadow: isCompleted
                        ? '0 8px 20px rgba(16, 185, 129, 0.4)'
                        : '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isCompleted ? 'default' : 'grab',
                    zIndex: 10,
                    transition: 'background 0.3s ease, box-shadow 0.3s ease'
                }}
                whileTap={{ cursor: 'grabbing' }}
            >
                <AnimatePresence mode="wait">
                    {!isCompleted ? (
                        <motion.div
                            key="chevron"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, rotate: 90 }}
                        >
                            <ChevronRight
                                size={28}
                                color={progress > 0.5 ? '#10B981' : '#6b7280'}
                                style={{ transition: 'color 0.2s' }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                        >
                            <Check
                                size={28}
                                color="white"
                                strokeWidth={3}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Progress Dots Indicator */}
            {!isCompleted && (
                <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 4,
                    pointerEvents: 'none'
                }}>
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: progress > (i / 5) ? 1.2 : 1,
                                backgroundColor: progress > (i / 5) ? '#ffffff' : 'rgba(107, 114, 128, 0.3)'
                            }}
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                transition: 'all 0.2s'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SlideToStart;

