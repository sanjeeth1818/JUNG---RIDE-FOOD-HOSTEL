import React from 'react';
import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

const StatusToggle = ({ isActive, onToggle, label = "" }) => {
    return (
        <motion.div
            className="premium-toggle-container"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: isActive ? '#059669' : '#f1f5f9',
                padding: '8px 8px 8px 20px',
                borderRadius: '100px',
                boxShadow: isActive ? '0 10px 20px rgba(5, 150, 105, 0.2)' : '0 4px 6px rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: isActive ? '#047857' : '#e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
            }}
            onClick={onToggle}
        >
            <span style={{
                fontSize: '13px',
                fontWeight: '900',
                color: isActive ? 'white' : '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                userSelect: 'none'
            }}>
                {label || (isActive ? 'SYSTEM ACTIVE' : 'SYSTEM OFFLINE')}
            </span>

            <motion.div
                style={{
                    position: 'relative',
                    width: '56px',
                    height: '28px',
                    borderRadius: '100px',
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3px',
                    transition: 'background 0.3s ease'
                }}
            >
                <motion.div
                    animate={{ x: isActive ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#059669' : '#94a3b8'
                    }}
                >
                    <Power size={12} strokeWidth={4} />
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default StatusToggle;
