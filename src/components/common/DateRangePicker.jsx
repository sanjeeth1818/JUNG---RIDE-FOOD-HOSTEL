import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClearFilters }) => {
    const [showCalendar, setShowCalendar] = useState(false);

    // Quick filter presets
    const applyQuickFilter = (filter) => {
        const now = new Date();
        let start, end;

        switch (filter) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'week':
                start = new Date(now.setDate(now.getDate() - 7));
                end = new Date();
                break;
            case 'month':
                start = new Date(now.setMonth(now.getMonth() - 1));
                end = new Date();
                break;
            case 'all':
                start = null;
                end = null;
                break;
            default:
                return;
        }

        onStartDateChange(start ? start.toISOString().split('T')[0] : null);
        onEndDateChange(end ? end.toISOString().split('T')[0] : null);
        setShowCalendar(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="date-range-picker">
            <style>{`
                .date-range-picker {
                    margin-bottom: 20px;
                }
                .quick-filters {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }
                .quick-filter-btn {
                    padding: 10px 18px;
                    border-radius: 12px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    font-weight: 600;
                    font-size: 13px;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .quick-filter-btn:hover {
                    border-color: #111827;
                    color: #111827;
                    background: #f9fafb;
                }
                .quick-filter-btn.active {
                    border-color: #111827;
                    background: #111827;
                    color: white;
                }
                .custom-date-section {
                    background: #f9fafb;
                    border-radius: 16px;
                    padding: 16px;
                }
                .date-inputs {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .date-input-group {
                    position: relative;
                }
                .date-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                    display: block;
                }
                .date-input {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1.5px solid #e5e7eb;
                    background: white;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1f2937;
                    transition: all 0.2s;
                }
                .date-input:focus {
                    outline: none;
                    border-color: #111827;
                    box-shadow: 0 0 0 3px rgba(17,24,39,0.1);
                }
                .clear-filters-btn {
                    margin-top: 12px;
                    width: 100%;
                    padding: 12px;
                    border-radius: 10px;
                    border: none;
                    background: #fee2e2;
                    color: #991b1b;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .clear-filters-btn:hover {
                    background: #fecaca;
                }
                .filter-summary {
                    margin-top: 16px;
                    padding: 12px 16px;
                    background: #dbeafe;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e40af;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            `}</style>

            {/* Quick Filters */}
            <div className="quick-filters">
                <button
                    className={`quick-filter-btn ${!startDate && !endDate ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('all')}
                >
                    All Time
                </button>
                <button
                    className="quick-filter-btn"
                    onClick={() => applyQuickFilter('today')}
                >
                    Today
                </button>
                <button
                    className="quick-filter-btn"
                    onClick={() => applyQuickFilter('week')}
                >
                    This Week
                </button>
                <button
                    className="quick-filter-btn"
                    onClick={() => applyQuickFilter('month')}
                >
                    This Month
                </button>
            </div>

            {/* Custom Date Range */}
            <div className="custom-date-section">
                <div className="date-inputs">
                    <div className="date-input-group">
                        <label className="date-label">From Date</label>
                        <input
                            type="date"
                            className="date-input"
                            value={startDate || ''}
                            onChange={(e) => onStartDateChange(e.target.value)}
                        />
                    </div>
                    <div className="date-input-group">
                        <label className="date-label">To Date</label>
                        <input
                            type="date"
                            className="date-input"
                            value={endDate || ''}
                            onChange={(e) => onEndDateChange(e.target.value)}
                        />
                    </div>
                </div>

                {(startDate || endDate) && (
                    <button className="clear-filters-btn" onClick={onClearFilters}>
                        <X size={16} />
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Summary */}
            {(startDate || endDate) && (
                <div className="filter-summary">
                    <Calendar size={16} />
                    <span>
                        {startDate && endDate
                            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                            : startDate
                                ? `From ${formatDate(startDate)}`
                                : `Until ${formatDate(endDate)}`}
                    </span>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
