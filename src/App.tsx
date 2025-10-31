import React, { useState, useEffect } from "react";
import "./index.css";

interface Holiday {
  id: number;
  startDate: string;
  endDate: string;
  name: string;
}

interface Shift {
  id: number;
  date: string;
  name: string;
}

const App: React.FC = () => {
  const [month, setMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [shiftForm, setShiftForm] = useState({ name: "", date: "" });
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  // Load from localStorage
  useEffect(() => {
    const storedShifts = localStorage.getItem("shifts");
    const storedHolidays = localStorage.getItem("holidays");
    if (storedShifts) setShifts(JSON.parse(storedShifts));
    if (storedHolidays) setHolidays(JSON.parse(storedHolidays));
  }, []);

  // Save to localStorage
  useEffect(() => localStorage.setItem("shifts", JSON.stringify(shifts)), [shifts]);
  useEffect(() => localStorage.setItem("holidays", JSON.stringify(holidays)), [holidays]);

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstDayIndex = startOfMonth.getDay(); // important for empty cells
  const daysInMonth = Array.from(
    { length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1).toISOString().split("T")[0]
  );

  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));

  // Add/Edit/Delete Guards
  const addShift = () => {
    if (!shiftForm.name || !shiftForm.date) return alert("Please fill all fields.");
    setShifts([...shifts, { id: Date.now(), ...shiftForm }]);
    setShiftForm({ name: "", date: "" });
  };
  const deleteShift = (id: number) => {
    if (window.confirm("Are you sure you want to delete this guard?")) {
      setShifts(shifts.filter((s) => s.id !== id));
    }
  };
  const editShift = (id: number) => {
    const toEdit = shifts.find((s) => s.id === id);
    if (!toEdit) return;
    setShiftForm({ name: toEdit.name, date: toEdit.date });
    setShifts(shifts.filter((s) => s.id !== id));
  };

  // Add/Edit/Delete Holidays
  const addHoliday = () => {
    if (new Date(holidayForm.startDate) > new Date(holidayForm.endDate))
      return alert("Start date cannot be after end date.");
    if (!holidayForm.name || !holidayForm.startDate || !holidayForm.endDate)
      return alert("Please fill all fields.");
    setHolidays([...holidays, { id: Date.now(), ...holidayForm }]);
    setHolidayForm({ name: "", startDate: "", endDate: "" });
  };
  const deleteHoliday = (id: number) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      setHolidays(holidays.filter((h) => h.id !== id));
    }
  };
  const editHoliday = (id: number) => {
    const toEdit = holidays.find((h) => h.id === id);
    if (!toEdit) return;
    setHolidayForm({ name: toEdit.name, startDate: toEdit.startDate, endDate: toEdit.endDate });
    setHolidays(holidays.filter((h) => h.id !== id));
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "type,id,name,date,startDate,endDate\n";
    shifts.forEach((s) => (csv += `shift,${s.id},${s.name},${s.date},,\n`));
    holidays.forEach((h) => (csv += `holiday,${h.id},${h.name},,${h.startDate},${h.endDate}\n`));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule.csv";
    a.click();
  };

  // Import CSV (merge)
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1); // skip header
      const newShifts: Shift[] = [];
      const newHolidays: Holiday[] = [];
      lines.forEach((line) => {
        if (!line.trim()) return;
        const [type, id, name, date, startDate, endDate] = line.split(",");
        if (type === "shift") newShifts.push({ id: Number(id), name, date });
        else if (type === "holiday") newHolidays.push({ id: Number(id), name, startDate, endDate });
      });
      // Merge avoiding duplicates
      setShifts((prev) => [...prev, ...newShifts.filter(ns => !prev.some(ps => ps.id === ns.id))]);
      setHolidays((prev) => [...prev, ...newHolidays.filter(nh => !prev.some(ph => ph.id === nh.id))]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="app-container">
      <h1 className="title">
        🪖🏖️ Guarding & Holidays Board –{" "}
        {month.toLocaleString("default", { month: "long", year: "numeric" })}
      </h1>

      <div className="nav-buttons">
        <button onClick={prevMonth}>← Previous</button>
        <button onClick={nextMonth}>Next →</button>
      </div>

      <div className="calendar-grid">
        {/* Weekday headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="day-header">{day}</div>
        ))}
        
        {/* Empty cells before the first day */}
        {Array.from({ length: firstDayIndex-1}).map((_, i) => (
          <div key={`empty-${i}`} className="day-cell empty"></div>
        ))}

        {/* Days in month */}
        {daysInMonth.map((date) => {
          const shift = shifts.find((s) => s.date === date);
          const holiday = holidays.find((h) => date >= h.startDate && date <= h.endDate);
          return (
            <div key={date} className={`day-cell ${holiday ? "holiday" : shift ? "shift" : ""}`}>
              <div className="day-number">{new Date(date).getDate()}</div>
              {shift && <div className="shift-name">🪖 {shift.name}</div>}
              {holiday && <div className="holiday-name">🏖️ {holiday.name}</div>}
            </div>
          );
        })}
      </div>

      <div className="form-section">
        <h2>Add / Edit Guard</h2>
        <input type="text" placeholder="Guard name" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} />
        <input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} />
        <button className="guard-btn" onClick={addShift}>Save Guard</button>
      </div>

      <div className="form-section">
        <h2>Add / Edit Holiday</h2>
        <input type="text" placeholder="Holiday name" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} />
        <input type="date" value={holidayForm.startDate} onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })} />
        <input type="date" value={holidayForm.endDate} onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })} />
        <button className="holiday-btn" onClick={addHoliday}>Save Holiday</button>
      </div>

      <br/>
      <div className="csv-section">
        <button className="export-btn" onClick={exportCSV} style={{fontSize: "15.9px",width: "130px", height: "37px"}}>Export CSV</button>
        <label className="import-label" style={{width: "90px", height: "17px"}}>
          Import CSV
          <input type="file" accept=".csv" onChange={importCSV} />
        </label>
      </div>


      <div className="list-section">
        <h2>Guards List</h2>
        {shifts.length === 0 ? <p>No guards yet.</p> : shifts.map((s) => (
          <div key={s.id} className="list-item">
            <span>🪖 {s.name} – {s.date}</span>
            <div className="actions">
              <button onClick={() => editShift(s.id)}>✏️</button>
              <button onClick={() => deleteShift(s.id)}>🗑️</button>
            </div>
          </div>
        ))}

        <h2>Holidays List</h2>
        {holidays.length === 0 ? <p>No holidays yet.</p> : holidays.map((h) => (
          <div key={h.id} className="list-item">
            <span>🏖️ {h.name}: {h.startDate} → {h.endDate}</span>
            <div className="actions">
              <button onClick={() => editHoliday(h.id)}>✏️</button>
              <button onClick={() => deleteHoliday(h.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
