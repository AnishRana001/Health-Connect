import { useState, useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MedicineCalendar = ({ appointments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Extract all medicines from appointments
  const allMedicines = useMemo(() => {
    let meds = [];
    appointments.forEach(apt => {
        if (apt.medicines && apt.medicines.length > 0) {
            apt.medicines.forEach(med => {
                // Determine end date based on duration
                const start = parseISO(med.startDate);
                const end = addDays(start, med.duration - 1); 
                meds.push({ ...med, aptId: apt._id, start, end, doctorName: apt.doctorId?.userId?.name || 'Unknown' });
            });
        }
    });
    return meds;
  }, [appointments]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = day => setSelectedDate(day);

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = new Date(day);
      
      // Check if this day has medicines
      const medsForDay = allMedicines.filter(m => {
          const startOfD = new Date(cloneDay).setHours(0,0,0,0);
          const mStart = new Date(m.start).setHours(0,0,0,0);
          const mEnd = new Date(m.end).setHours(23,59,59,999);
          return startOfD >= mStart && startOfD <= mEnd;
      });

      const hasMeds = medsForDay.length > 0;

      days.push(
        <div 
          className={`cal-cell ${!isSameMonth(day, monthStart) ? "disabled" : isSameDay(day, selectedDate) ? "selected" : ""} ${hasMeds ? "has-meds" : ""}`} 
          key={day.toISOString()} 
          onClick={() => onDateClick(cloneDay)}
        >
          <span className="cal-date">{formattedDate}</span>
          {hasMeds && <span className="cal-dot"></span>}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div className="cal-row" key={day.toISOString()}>{days}</div>);
    days = [];
  }

  // Find meds for currently selected date
  const selectedMeds = allMedicines.filter(m => {
      const selD = new Date(selectedDate).setHours(0,0,0,0);
      const mStart = new Date(m.start).setHours(0,0,0,0);
      const mEnd = new Date(m.end).setHours(23,59,59,999);
      return selD >= mStart && selD <= mEnd;
  });

  return (
    <div className="medicine-calendar-container flex gap-2" style={{ alignItems: 'flex-start' }}>
      <div className="calendar-card card" style={{ flex: '1', padding: '1rem', minWidth: '350px' }}>
        <div className="cal-header flex justify-between items-center mb-1">
           <button onClick={prevMonth} className="btn-icon"><ChevronLeft /></button>
           <h3 style={{ margin: 0 }}>{format(currentDate, "MMMM yyyy")}</h3>
           <button onClick={nextMonth} className="btn-icon"><ChevronRight /></button>
        </div>
        <div className="cal-days flex justify-between mb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="cal-day-name text-center" style={{ width: '14.28%', fontWeight: '600', color: 'var(--text-muted)' }}>{d}</div>)}
        </div>
        <div className="cal-body">
            {rows}
        </div>
      </div>
      
      <div className="calendar-details card" style={{ flex: '1', padding: '1.5rem', minWidth: '350px' }}>
         <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Medicines for {format(selectedDate, "MMM d, yyyy")}</h3>
         {selectedMeds.length === 0 ? (
             <p className="text-muted mt-1">No medicines prescribed for this day.</p>
         ) : (
             <div className="meds-list mt-1">
                {selectedMeds.map((m, i) => (
                    <div key={i} className="med-item flex justify-between items-center mb-1" style={{background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem'}}>
                        <div>
                            <h4 style={{ color: 'var(--primary)', margin: '0 0 0.2rem 0' }}>{m.name}</h4>
                            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Dr. {m.doctorName}</p>
                        </div>
                        <div className="text-right">
                           <span className="badge badge-success" style={{ fontSize: '1rem' }}>{m.dosage}</span>
                        </div>
                    </div>
                ))}
             </div>
         )}
      </div>
    </div>
  );
}

export default MedicineCalendar;
