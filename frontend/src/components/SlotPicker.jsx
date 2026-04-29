import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import './SlotPicker.css';

/* ── helpers ──────────────────────────────────────────────────────────── */

const DAY_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Formats a Date object → "YYYY-MM-DD" (local date, no timezone shift).
 */
const toYMD = (date) => {
  const y  = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d  = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
};

/**
 * Returns an array of N Date objects starting from tomorrow.
 */
const buildStrip = (numDays = 14) => {
  const days = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < numDays; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
};

/**
 * Convert "HH:MM" 24h → "H:MM AM/PM"
 */
const fmt12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hr   = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

/* ── Component ───────────────────────────────────────────────────────── */

/**
 * SlotPicker
 *
 * Props:
 *   doctorId     — string, required
 *   workingDays  — string[], e.g. ["Mon","Tue","Thu"]  (from doctor profile)
 *   unavailableDates — string[], YYYY-MM-DD list        (from doctor profile)
 *   onSelect     — callback({ date: "YYYY-MM-DD", time: "HH:MM" })
 *   stripDays    — number of days to show in strip (default 14)
 */
const SlotPicker = ({
  doctorId,
  workingDays   = [],
  unavailableDates = [],
  onSelect,
  stripDays = 14,
}) => {
  const strip = buildStrip(stripDays);

  const [selectedDate, setSelectedDate]   = useState(null);
  const [selectedTime, setSelectedTime]   = useState(null);
  const [slots,        setSlots]          = useState(null);   // null = not yet fetched
  const [loading,      setLoading]        = useState(false);
  const [error,        setError]          = useState('');

  /* Normalise working days to first-3 abbreviations ("Monday" → "Mon").
     Also handle the legacy "all" value which means every day. */
  const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isAllDays = workingDays.some((d) => d.toLowerCase() === 'all');
  const workSet = isAllDays
    ? new Set(allDays)
    : new Set(workingDays.map((d) => d.substring(0, 3)));

  const isDayOff        = (date) => !workSet.has(DAY_LABELS[date.getDay()]);
  const isVacation      = (date) => unavailableDates.includes(toYMD(date));
  const isDisabled      = (date) => isDayOff(date) || isVacation(date);

  /* Fetch slots when a date is selected */
  const fetchSlots = useCallback(async (dateStr) => {
    setLoading(true);
    setSlots(null);
    setError('');
    try {
      const { data } = await api.get(`/availability/${doctorId}/slots?date=${dateStr}`);
      setSlots(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load slots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const handleDateClick = (date) => {
    if (isDisabled(date)) return;
    const ymd = toYMD(date);
    setSelectedDate(ymd);
    setSelectedTime(null);
    onSelect && onSelect({ date: ymd, time: null });
    fetchSlots(ymd);
  };

  const handleSlotClick = (time) => {
    setSelectedTime(time);
    onSelect && onSelect({ date: selectedDate, time });
  };

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="sp-root">

      {/* ── Week Strip ──────────────────────────────────────────────── */}
      <div className="sp-strip-wrapper">
        <div className="sp-strip">
          {strip.map((date) => {
            const ymd      = toYMD(date);
            const disabled = isDisabled(date);
            const active   = ymd === selectedDate;
            const vacation = isVacation(date);

            return (
              <button
                key={ymd}
                type="button"
                disabled={disabled}
                onClick={() => handleDateClick(date)}
                className={[
                  'sp-day',
                  active    ? 'sp-day--active'    : '',
                  disabled  ? 'sp-day--disabled'  : '',
                  vacation  ? 'sp-day--vacation'  : '',
                ].join(' ')}
                title={vacation ? 'Doctor unavailable' : disabled ? 'Not a working day' : ''}
              >
                <span className="sp-day-name">{DAY_LABELS[date.getDay()]}</span>
                <span className="sp-day-num">{date.getDate()}</span>
                <span className="sp-day-month">{MONTH_LABELS[date.getMonth()]}</span>
                {vacation && <span className="sp-vacation-dot" title="Doctor unavailable" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Slot Grid ───────────────────────────────────────────────── */}
      <div className="sp-slots-area">
        {!selectedDate && (
          <p className="sp-hint">
            <span className="sp-hint-icon">📅</span>
            Select an available date above to see appointment slots.
          </p>
        )}

        {selectedDate && loading && (
          <div className="sp-skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="sp-skeleton-chip skeleton" />
            ))}
          </div>
        )}

        {selectedDate && !loading && error && (
          <p className="sp-error">{error}</p>
        )}

        {selectedDate && !loading && !error && slots && (
          <>
            {slots.available.length === 0 ? (
              <div className="sp-no-slots">
                <span className="sp-no-slots-icon">🚫</span>
                <p className="sp-no-slots-title">
                  {slots.reason || 'No slots available for this date.'}
                </p>
                <p className="sp-no-slots-sub">Please try another date.</p>
              </div>
            ) : (
              <>
                <div className="sp-slots-header">
                  <span className="sp-slots-label">
                    Available Times
                    <span className="sp-slots-count"> · {slots.available.length} slots</span>
                  </span>
                  <span className="sp-slot-duration">
                    ⏱ {slots.slotDuration || 30} min/slot
                  </span>
                </div>
                <div className="sp-grid">
                  {slots.allSlots.map((time) => {
                    const isBooked   = slots.bookedSlots.includes(time);
                    const isSelected = time === selectedTime;
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && handleSlotClick(time)}
                        className={[
                          'sp-chip',
                          isBooked   ? 'sp-chip--booked'   : 'sp-chip--available',
                          isSelected ? 'sp-chip--selected' : '',
                        ].join(' ')}
                        title={isBooked ? 'Already booked' : `Book ${fmt12(time)}`}
                      >
                        {fmt12(time)}
                        {isBooked && <span className="sp-booked-badge">Booked</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Selection Summary ────────────────────────────────────────── */}
      {selectedDate && selectedTime && (
        <div className="sp-summary">
          <span className="sp-summary-icon">✅</span>
          <span>
            Selected: <strong>{selectedDate}</strong> at <strong>{fmt12(selectedTime)}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
