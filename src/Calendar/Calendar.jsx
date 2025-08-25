import html2canvas from "html2canvas-pro";
import { useCallback, useEffect, useState, useRef } from "react";
import { getHolidays, getTailwindColors, getVacationDays } from "./dates.js";

// Minimal presentational calendar view.
// All logic, state and side-effects removed. This component only renders a static layout.

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const WEEKDAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// ISO week number (1-53)
function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // Monday=1..Sunday=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function getMonthGridStartMonday(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeekMon = (firstOfMonth.getDay() + 6) % 7; // Monday=0
  return new Date(year, month, 1 - dayOfWeekMon);
}
export function CalendarGrid({ colors, workdays, shot, setShot, year, setYear, persons = [] }) {
  const [holidays, setHolidays] = useState(getHolidays(year));
  const [vacations, setVacations] = useState(getVacationDays(year));
  const [infoText, setInfoText] = useState("");
  useEffect(() => {
    setHolidays(getHolidays(year));
    setVacations(getVacationDays(year));
    if (year < 2025 || year > 2030) {
      setInfoText("Achtung: Nur Daten zwischen 2025-2030 verfügbar");
    } else {
      setInfoText("");
    }
  }, [year]);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const cellSize = "h-8 aspect-square";
  // prepare quick lookup sets for holidays, vacations and workdays (format 'year-month-day')
  const holidaySet = new Set((holidays || []).map((h) => `${h.year}-${h.month}-${h.day}`));
  const workdaysSet = new Set((workdays || []).map((w) => `${w.year}-${w.month}-${w.day}`));
  const vacationSet = new Set();
  (vacations || []).forEach((v) => {
    if (!v || v.year == null || v.month == null || v.firstDay == null || v.lastDay == null) return;
    for (let d = v.firstDay; d <= v.lastDay; d++) vacationSet.add(`${v.year}-${v.month}-${d}`);
  });
  useEffect(() => {
    if (shot.shot) takeshot(shot.target);
  }, [shot]);
  function takeshot(target) {
    let div = document.getElementById(target);
    const reset = () => setShot({ shot: false, target: "calendar" });
    html2canvas(div, { scale: 2 }).then(function (canvas) {
      const link = document.createElement("a");
      link.download =
        shot.target == "calendar" ? `${year}.png` : `${MONTH_NAMES[parseInt(shot.target.split("-")[1])]}-${year}.png`;
      link.href = canvas.toDataURL();
      link.click();
      reset();
    });
  }
  return (
    <div id="calendar">
      <div className={`flex flex-col min-h-0 m-1`}>
        <CalendarHeader colors={colors} persons={persons} />
        <div className={`${colors.attentionText} text-xs`}>{infoText}</div>
        <div className="gap-[1px] grid grid-cols-4">
          {months.map((month) => {
            const gridStart = getMonthGridStartMonday(year, month);
            const weekMondays = Array.from({ length: 6 }).map((_, wi) => {
              const d = new Date(gridStart);
              d.setDate(gridStart.getDate() + wi * 7);
              return d;
            });

            return (
              <div key={"m-" + month} id={"m-" + month}>
                <div className={` ${shot.shot && shot.target != "calendar" ? "m-1" : ""} `}>
                  {shot.shot && shot.target != "calendar" && <CalendarHeader persons={persons} colors={colors} shot={shot.shot} />}
                  <div key={month} className="flex flex-col gap-[1px] p-[1px] border rounded h-full">
                    <div className="font-semibold text-center">
                      {MONTH_NAMES[month]} {shot.shot && shot.target != "calendar" && year}
                    </div>

                    {/* Header: KW + weekdays */}
                    <div className="flex items-center gap-[1px]">
                      <div className={`bg-gray-100 border rounded ${cellSize} text-xs text-center`}>KW</div>
                      <div className="flex-1 gap-[1px] grid grid-cols-7">
                        {WEEKDAY_NAMES.map((wd) => (
                          <div key={wd} className={`bg-gray-100 border rounded ${cellSize} text-xs text-center`}>
                            {wd}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6 rows: each row has KW cell + 7 day cells */}
                    <>
                      {weekMondays.map((monday, wi) => (
                        <div key={wi} className="flex items-stretch gap-[1px]">
                          <div className={`bg-gray-50 border rounded ${cellSize} text-xs text-center`}>
                            {getISOWeekNumber(monday)}
                          </div>
                          <div className="flex-1 gap-[1px] grid grid-cols-7">
                            {Array.from({ length: 7 }).map((_, di) => {
                              const cellDate = new Date(monday);
                              cellDate.setDate(monday.getDate() + di);
                              const inMonth = cellDate.getMonth() === month;
                              const m = cellDate.getMonth() + 1;
                              const d = cellDate.getDate();
                              const key = `${year}-${m}-${d}`;
                              const isHoliday = holidaySet.has(key);
                              const isVacation = vacationSet.has(key);
                              const isWorkday = workdaysSet.has(key);
                              const workdayObj = workdays?.find((w) => w.year === year && w.month === m && w.day === d);
                              const isSpecialWorkday = !!workdayObj && workdayObj.special;
                              const colorBorderSpecialClass = isSpecialWorkday
                                ? " border-2 " + colors.attentionBorder
                                : " border-2 border-transparent ";
                              const colorBgClass = !inMonth ? " bg-gray-100 " : workdayObj ? workdayObj.color : "";
                              const colorBorderClass = !inMonth
                                ? " text-gray-400 "
                                : isHoliday
                                  ? colors.holidayBorder + " border-2 "
                                  : isVacation
                                    ? colors.vacationBorder + " border-2 "
                                    : "" + (isWorkday ? " border-2 " : "");
                              return (
                                <div
                                  key={di}
                                  title={
                                    isHoliday
                                      ? holidays.find((h) => h.year === year && h.month === m && h.day === d)?.name
                                      : isVacation
                                        ? vacations.find(
                                          (v) => v.year === year && v.month === m && d >= v.firstDay && d <= v.lastDay
                                        )?.name
                                        : ""
                                  }
                                  className={`border rounded ${cellSize} text-end flex text-xs font-bold ${colorBgClass} ${colorBorderClass}`}
                                >
                                  <div
                                    className={`flex items-end justify-end h-full w-full  rounded ${inMonth ? colorBorderSpecialClass : ""
                                      }`}
                                  >
                                    <div
                                      className={`${inMonth ? "bg-white" : ""} rounded h-4 aspect-square text-center`}
                                    >
                                      {inMonth && cellDate.getDate()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarHeader({ shot = false, colors, persons }) {
  return (
    <div className={`flex ${shot ? "flex-col" : "flex-row"} gap-1 mb-[1px]`}>
      <div className="flex gap-1 p-1 border rounded">
        <div className="flex gap-1">
          <div className={`h-6 aspect-square border-2 ${colors.vacationBorder} rounded`}></div>
          <span>Ferien</span>
        </div>
        <div className="flex gap-1">
          <div className={`h-6 aspect-square border-2 ${colors.holidayBorder} rounded`}></div>
          <span>Feiertag</span>
        </div>
      </div>
      <div className={`flex ${shot ? " flex-col " : " flex-row "} gap-1 p-1 border rounded`}>
        <div className="flex gap-1">
          <div className={`h-6 aspect-square border-2 rounded`}>
            <div className={`border-2 ${colors.attentionBorder} w-full h-full`}></div>
          </div>
          <span>Achtung!</span>
        </div>
        {persons?.map((p, i) => (
          <div className="flex items-center gap-1" key={p.id || i}>
            <div className={`h-6 aspect-square border-2 bg-${p.color || 'bg-gray-200'} rounded`}></div>
            <span>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSettings({ colors, setColors, state, setState }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorSelector, showColorSelector] = useColorSelector();
  const [showNewWorkday, setShowNewWorkday] = useState(false);
  // path to the data file (loaded from main process via preload API)
  const [dataFilePath, setDataFilePath] = useState('');

  useEffect(() => {
    let mounted = true;
    try {
      if (window?.api?.getDataFilePath) {
        window.api.getDataFilePath().then((p) => {
          if (mounted) setDataFilePath(p || '');
        }).catch(() => {
          /* ignore */
        });
      }
    } catch (e) {
      // ignore
    }
    return () => { mounted = false };
  }, []);

  // Header menu
  const [headerMenu, setHeaderMenu] = useState("");
  const handleClickHeaderMenu = (menu) => {
    if (headerMenu == "") {
      setHeaderMenu(menu);
    } else {
      if (headerMenu == menu) setHeaderMenu("");
      else setHeaderMenu(menu);
    }
  }
  // persons management
  const [showNewPerson, setShowNewPerson] = useState(false);
  const persons = (state?.DATA?.persons) || [];
  const [editIndex, setEditIndex] = useState(-1);
  const [personName, setPersonName] = useState("");
  const [personColor, setPersonColor] = useState("");

  // allocation management
  const [allocationMenu, setAllocationMenu] = useState("");


  // Color Management
  const handleClickShowAllocationMenu = (menu) => {
    if (allocationMenu == "") {
      setAllocationMenu(menu);
    } else {
      if (allocationMenu == menu) setAllocationMenu("");
      else setAllocationMenu(menu);
    }
  };

  const handleClickShowSelector = async () => {
    const result = await showColorSelector({ top: 100, left: 100, selectedColor });
    setSelectedColor(result);
  };

  // period allocation state (for "Neue Periode")
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodWeekday, setPeriodWeekday] = useState(5); // default Samstag (Mo=0)
  const [periodPersonIndex, setPeriodPersonIndex] = useState(-1);
  const [periodHolidayMap, setPeriodHolidayMap] = useState({});

  // current allocation (month view) state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  // default to January so the workdays overview starts at the beginning of the year
  const [currentMonth, setCurrentMonth] = useState(0); // 0-11 (0 = January)
  const [currentPersonIndex, setCurrentPersonIndex] = useState(-1);
  const [currentHolidayMap, setCurrentHolidayMap] = useState({});

  useEffect(() => {
    // build holiday map for the selected year
    try {
      const hs = getHolidays(periodYear) || [];
      const map = {};
      hs.forEach((h) => {
        map[`${h.year}-${h.month}-${h.day}`] = h;
      });
      setPeriodHolidayMap(map);
    } catch (e) {
      setPeriodHolidayMap({});
    }
  }, [periodYear]);

  useEffect(() => {
    try {
      const hs = getHolidays(currentYear) || [];
      const map = {};
      hs.forEach((h) => (map[`${h.year}-${h.month}-${h.day}`] = h));
      setCurrentHolidayMap(map);
    } catch (e) {
      setCurrentHolidayMap({});
    }
  }, [currentYear]);

  function getDatesForWeekday(year, weekdayIndex) {
    // weekdayIndex: 0 = Mo, ..., 6 = So
    const dates = [];
    const jsTarget = (weekdayIndex + 1) % 7; // JS: 0=Sun,1=Mon,...
    const start = new Date(year, 0, 1);
    // find first occurrence
    let d = new Date(start);
    while (d.getFullYear() === year) {
      if (d.getDay() === jsTarget) {
        break;
      }
      d.setDate(d.getDate() + 1);
    }
    if (d.getFullYear() !== year) return dates;
    for (let cur = new Date(d); cur.getFullYear() === year; cur.setDate(cur.getDate() + 7)) {
      dates.push(new Date(cur));
    }
    return dates;
  }

  function toggleAssignDate(dt) {
    // dt: Date
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const workdays = (state?.DATA?.workdays) || [];
    const idx = workdays?.findIndex((w) => w.year === y && w.month === m && w.day === d);
    // if a person is selected, assign/update to that person; else toggle removal
    if (periodPersonIndex >= 0 && persons[periodPersonIndex]) {
      const person = persons[periodPersonIndex];
      const name = person.name || "";
      const pc = person.color || "";
      const colorVal = pc.startsWith('bg-') ? pc : (pc ? `bg-${pc}` : 'bg-green-300');
      if (idx >= 0) {
        // update existing
        const newWork = [...workdays];
        newWork[idx] = { ...newWork[idx], name, color: colorVal };
        setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
      } else {
        // create new
        const newWork = [...workdays, { year: y, month: m, day: d, name, color: colorVal, special: false }];
        setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
      }
    } else {
      // no person selected -> toggle removal if exists
      if (idx >= 0) {
        const newWork = workdays?.filter((_, i) => i !== idx);
        setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
      }
    }
  }

  function getDaysInMonth(year, monthIndex) {
    // monthIndex: 0-11
    const days = [];
    const d = new Date(year, monthIndex, 1);
    while (d.getMonth() === monthIndex) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  function toggleAssignCurrent(dt) {
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const workdays = (state?.DATA?.workdays) || [];
    const idx = workdays?.findIndex((w) => w.year === y && w.month === m && w.day === d);
    if (currentPersonIndex >= 0 && persons[currentPersonIndex]) {
      const person = persons[currentPersonIndex];
      const name = person.name || "";
      const pc = person.color || "";
      const colorVal = pc.startsWith('bg-') ? pc : (pc ? `bg-${pc}` : 'bg-green-300');
      if (idx >= 0) {
        const newWork = [...workdays];
        newWork[idx] = { ...newWork[idx], name, color: colorVal };
        setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
      } else {
        const newWork = [...workdays, { year: y, month: m, day: d, name, color: colorVal, special: false }];
        setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
      }
    } else {
      if (idx >= 0) {
        const newWork = workdays?.filter((_, i) => i !== idx);
        setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
      }
    }
  }

  function toggleSpecialDate(dt) {
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const workdays = (state?.DATA?.workdays) || [];
    const idx = workdays?.findIndex((w) => w.year === y && w.month === m && w.day === d);
    if (idx >= 0) {
      const newWork = [...workdays];
      newWork[idx] = { ...newWork[idx], special: !newWork[idx].special };
      setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
    } else {
      // create a minimal workday entry with special flag
      const newWork = [...workdays, { year: y, month: m, day: d, name: '', color: 'bg-green-300', special: true }];
      setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWork } }));
    }
  }

  const startEdit = (i) => {
    const p = persons[i];
    setShowNewPerson(true);
    setEditIndex(i);
    setPersonName(p?.name || "");
    setPersonColor(p?.color || "");
  };

  const clearForm = () => {
    setShowNewPerson(false);
    setEditIndex(-1);
    setPersonName("");
    setPersonColor("");

  };

  const savePerson = () => {
    personColor == "" && alert("keine farbe gewählt");
    if (personColor == "") return;
    personName == "" && alert("kein Name gewählt");
    if (personName == "") return;
    const newPerson = { name: personName, color: personColor };
    const newPersons = [...persons];
    let oldPerson = null;
    if (editIndex >= 0 && editIndex < newPersons.length) {
      oldPerson = newPersons[editIndex];
      newPersons[editIndex] = newPerson;
    } else {
      newPersons.push(newPerson);
    }

    // If we're editing an existing person and the name or color changed,
    // update existing workdays that belong to that person (match by name or by stored color).
    const normalizeColor = (c) => (c ? (c.startsWith('bg-') ? c : `bg-${c}`) : null);
    let newWorkdays = (state?.DATA?.workdays) || [];
    if (oldPerson) {
      const oldName = oldPerson.name || '';
      const newName = newPerson.name || '';
      const oldColor = normalizeColor(oldPerson.color);
      const newColor = normalizeColor(newPerson.color);
      if ((oldName && oldName !== newName) || (oldColor && oldColor !== newColor)) {
        newWorkdays = newWorkdays.map((w) => {
          if ((oldName && w.name === oldName) || (oldColor && w.color === oldColor)) {
            return { ...w, name: newName || w.name, color: newColor || w.color };
          }
          return w;
        });
      }
    }

    setState((s) => ({ ...s, DATA: { ...s.DATA, persons: newPersons, workdays: newWorkdays } }));
    clearForm();
  };

  const deletePerson = (i) => {
    const newPersons = persons.filter((_, idx) => idx !== i);
    setState((s) => ({ ...s, DATA: { ...s.DATA, persons: newPersons } }));
    clearForm();
  };

  // ...existing code...

  return (
    <>
      <div className="min-w-[800px]">
        <h2 className="font-bold">Kalender Einstellungen</h2>
        <div>
          <button className={headerMenu == "personen" ? 'active' : ''} onClick={() => handleClickHeaderMenu("personen")}>Personen</button>
          <button className={headerMenu == "zuweisung" ? 'active' : ''} onClick={() => handleClickHeaderMenu("zuweisung")}>Zuweisung</button>
          <button className={headerMenu == "appFarben" ? 'active' : ''} onClick={() => handleClickHeaderMenu("appFarben")}>App Farben</button>
          <button className={headerMenu == "einstellungenBackup" ? 'active' : ''} onClick={() => handleClickHeaderMenu("einstellungenBackup")}>Einstellungen Backup</button>
        </div>
        <div className="flex flex-col gap-2">
          {headerMenu == "personen" && <div className="p-2 border rounded">
            <div className="flex justify-between">
              <h3 className="font-semibold">Personen</h3>
              <button onClick={() => setShowNewPerson(true)}>Neu</button>
            </div>
            {showNewPerson && <div className="flex flex-col items-center gap-2 bg-green-100 mt-1 p-1 border rounded">
              <div className="flex flex-row items-center gap-2">
                <button onClick={async () => {
                  const res = await showColorSelector({ top: 100, left: 100, selectedColor: personColor });
                  if (res) setPersonColor(res);
                }}>Farbe</button>
                <div className={`h-6 aspect-square border-2 bg-${personColor == "" ? 'white' : personColor} rounded items-center flex justify-center`}><span title="Eine Farbe aussuchen">{personColor == "" ? '🎨' : ""}</span></div>
                <input className="bg-white p-1 border rounded" placeholder="Name" value={personName} onChange={(e) => setPersonName(e.target.value)} />
              </div>
              <div className="flex flex-row gap-2">
                <button onClick={savePerson}>{editIndex >= 0 ? 'Update' : 'Speichern'}</button>
                <button onClick={clearForm}>Abbrechen</button>
              </div>
            </div>}
            <div className="mt-1 p-1 border rounded">
              {persons.length === 0 && <div className="text-gray-500 text-xs">Keine Personen</div>}
              {persons.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-1 [&:not(:last-child)]:border-b">
                  <div className="flex flex-row flex-1 gap-2">
                    <div className={`h-6 aspect-square border-2 bg-${p.color || 'bg-gray-200'} rounded`}></div>
                    <span>{p.name}</span>
                  </div>
                  <button onClick={() => startEdit(i)}>Edit</button>
                  <button onClick={() => deletePerson(i)}>Löschen</button>
                </div>
              ))}
            </div>
          </div>}
          {headerMenu == "zuweisung" && <div>
            <div className="p-2 border rounded"><h3 className="font-semibold">Zuweisen von Personen</h3>
              <div className="mb-1">
                <button className={allocationMenu == "current" ? 'active' : ''} onClick={() => handleClickShowAllocationMenu("current")}>Aktuelle zuweisung</button>
                <button className={allocationMenu == "newPeriod" ? 'active' : ''} onClick={() => handleClickShowAllocationMenu("newPeriod")}>Periode</button>
                <button className={allocationMenu == "personen" ? 'active' : ''} onClick={() => handleClickShowAllocationMenu("personen")}>Personen</button>
              </div>
              {allocationMenu == "current" && (
                <div className="p-2 border rounded">
                  <div className="font-medium">Aktuelle Zuweisung (Monatsübersicht)</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div>
                      <label className="text-xs">Jahr</label>
                      <input type="number" min="1970" max="2099" className="ml-1 p-1 border rounded w-24" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs">Monat</label>
                      <select className="ml-1 p-1 border rounded" value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))}>
                        {MONTH_NAMES.map((mName, idx) => (<option key={idx} value={idx}>{mName}</option>))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="text-xs">Person</label>
                      <div className="flex items-center gap-2 ml-1">
                        <div onClick={() => setCurrentPersonIndex(-1)} className={`cursor-pointer border-2 ${currentPersonIndex === -1 ? 'border-amber-500' : ''} rounded w-6 h-6 aspect-square items-center flex justify-center font-bold`}></div>
                        {persons.map((p, i) => (
                          <div key={i} onClick={() => setCurrentPersonIndex(i)} className={`cursor-pointer border-2 ${currentPersonIndex === i ? 'border-amber-500' : ''} rounded w-6 h-6 aspect-square items-center flex justify-center font-bold bg-${p.color}`} title={p.name}>
                            {p.name?.slice(0, 1)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-gray-600 text-sm">Klicke Tag, um zuweisen / entfernen</div>
                  </div>
                  <div className="flex mt-2">
                    <div className="gap-1 grid grid-cols-7 mb-1 font-medium">
                      {WEEKDAY_NAMES.map((wd) => (<div key={wd} className="text-center">{wd}</div>))}
                      {getDaysInMonth(currentYear, currentMonth).map((dt) => {
                        const y = dt.getFullYear();
                        const m = dt.getMonth() + 1;
                        const d = dt.getDate();
                        const key = `${y}-${m}-${d}`;
                        const holiday = currentHolidayMap[key];
                        const existing = (state?.DATA?.workdays || []).find((w) => w.year === y && w.month === m && w.day === d);
                        return (
                          <div key={key} onClick={() => toggleAssignCurrent(dt)} className={`p-1 aspect-square border rounded h-20 cursor-pointer flex flex-col justify-between ${existing ? '' : ''}`}>
                            <div className="flex justify-between items-center w-full">
                              <div className="text-xs">{d}</div>
                              <input title="Spezial!" type="checkbox" checked={!!existing?.special} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); toggleSpecialDate(dt); }} />
                            </div>
                            <div className="text-red-600 text-xs text-center">{holiday ? holiday.name : ''}</div>
                            <div className="flex justify-center">
                              <div className={`w-6 h-6 rounded border-2 ${existing ? existing.color : 'transparent'} flex items-center justify-center font-bold`}>{existing ? existing.name?.slice(0, 1) : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {allocationMenu == "newPeriod" && (
                <div className="p-2 border rounded">
                  <div className="font-medium">Periode (Wochentags-Zuordnung über Jahr)</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div>
                      <label className="text-xs">Jahr</label>
                      <input type="number" min="1970" max="2099" className="ml-1 p-1 border rounded w-24" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs">Wochentag</label>
                      <select className="ml-1 p-1 border rounded" value={periodWeekday} onChange={(e) => setPeriodWeekday(Number(e.target.value))}>
                        <option value={-1}>Feiertag</option>
                        {WEEKDAY_NAMES.map((n, idx) => (<option key={idx} value={idx}>{n}</option>))}
                      </select>
                    </div>
                    <div>

                      {/* <select className="ml-1 p-1 border rounded" value={periodPersonIndex} onChange={(e) => setPeriodPersonIndex(Number(e.target.value))}>
                        <option value={-1}>-- wählen --</option>
                        {persons.map((p, i) => (<option key={i} value={i}>{p.name}</option>))}
                      </select> */}
                      <div className="flex flex-row items-center gap-1"><label className="text-xs">Person</label><div onClick={() => setPeriodPersonIndex(-1)} className={`cursor-pointer border-2 ${periodPersonIndex === -1 ? 'border-amber-500' : ''} rounded w-6 h-6 aspect-square items-center flex justify-center font-bold`}></div>{persons.map((p, i) => (<div onClick={() => setPeriodPersonIndex(i)} key={i} value={i} className={`cursor-pointer border-2 ${periodPersonIndex === i ? 'border-amber-500' : ''} rounded w-6 h-6 aspect-square items-center flex justify-center font-bold bg-${p.color}`}>{p.name.split("")[0]}</div>))}</div>

                    </div>
                    <div className="text-gray-600 text-sm">Klicke Datum, um zuweisen / entfernen</div>
                  </div>
                  <div className="mt-2">

                    <div className="gap-1 grid grid-cols-10 mt-1 p-1 border rounded">
                      {periodWeekday === -1 ? (
                        // show holidays
                        Object.values(periodHolidayMap || {}).sort((a, b) => (a.month - b.month) || (a.day - b.day)).map((h) => {
                          const y = h.year; const m = h.month; const d = h.day; const key = `${y} - ${m} - ${d}`;
                          const dt = new Date(y, m - 1, d);
                          const existing = (state?.DATA?.workdays || []).find((w) => w.year === y && w.month === m && w.day === d);
                          return (
                            <div key={key} className="flex flex-col items-center gap-2 hover:bg-gray-100 py-1 border rounded cursor-pointer" onClick={() => toggleAssignDate(dt)}>
                              <div className="flex justify-between items-center w-full">
                                <div>{String(d).padStart(2, '0')}.{String(m).padStart(2, '0')}.</div>
                                <input title="Spezial!" type="checkbox" checked={!!existing?.special} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); toggleSpecialDate(dt); }} />
                              </div>
                              <div className="text-red-600 text-xs text-center">{h.name}</div>
                              <div className={`flex items-center justify-center border-2 font-bold rounded w-6 h-6 aspect-square ${existing ? existing.color : 'transparent'}`}>{existing ? `${existing.name.split("")[0]}` : ''}</div>
                            </div>
                          );
                        })
                      ) : (
                        getDatesForWeekday(periodYear, periodWeekday).map((dt) => {
                          const y = dt.getFullYear();
                          const m = dt.getMonth() + 1;
                          const d = dt.getDate();
                          const key = `${y}-${m}-${d}`;
                          const holiday = periodHolidayMap[key];
                          const existing = (state?.DATA?.workdays || []).find((w) => w.year === y && w.month === m && w.day === d);
                          return (
                            <div key={key} className="flex flex-col items-center gap-2 hover:bg-gray-100 py-1 border rounded cursor-pointer" onClick={() => toggleAssignDate(dt)}>
                              <div className="flex justify-between items-center w-full">
                                <div>{String(d).padStart(2, '0')}.{String(m).padStart(2, '0')}.</div>
                                <input title="Spezial!" type="checkbox" checked={!!existing?.special} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); toggleSpecialDate(dt); }} />
                              </div>
                              <div className={`flex items-center justify-center border-2 font-bold rounded w-6 h-6 aspect-square ${existing ? existing.color : 'transparent'}`}>{existing ? `${existing.name.split("")[0]}` : ''}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
              {allocationMenu == "personen" && (<div className="p-2 border rounded">Test</div>)}
            </div>
          </div>}

          {headerMenu == "appFarben" && <div className="p-2 border rounded">
            <h4 className="font-semibold">App Farben</h4>
            <div className={`gap-2 grid grid-cols-3 mt-2`}>
              {[
                { id: 'holiday', label: 'Ferien' },
                { id: 'vacation', label: 'Urlaub' },
                { id: 'attention', label: 'Achtung' },
              ].map((grp) => (
                <div key={grp.id} className="p-2 border rounded">
                  <div className="font-medium">{grp.label}</div>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">Hintergrund</div>
                      <button
                        onClick={async () => {
                          const res = await showColorSelector({ top: 100, left: 100, selectedColor: colors[`${grp.id}Bg`] });
                          if (res) setColors((c) => ({ ...c, [`${grp.id}Bg`]: `bg-${res}` }));
                        }}
                      >
                        Wählen
                      </button>
                      <div title={colors[`${grp.id}Bg`]} className={`w-6 h-6 rounded ${colors[`${grp.id}Bg`]}`}></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">Rand</div>
                      <button
                        onClick={async () => {
                          const res = await showColorSelector({ top: 100, left: 100, selectedColor: colors[`${grp.id}Border`] });
                          if (res) setColors((c) => ({ ...c, [`${grp.id}Border`]: `border-${res}` }));
                        }}
                      >
                        Wählen
                      </button>
                      <div title={colors[`${grp.id}Border`]} className={`w-6 h-6 rounded border-2 ${colors[`${grp.id}Border`]}`}></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">Text</div>
                      <button
                        onClick={async () => {
                          const res = await showColorSelector({ top: 100, left: 100, selectedColor: colors[`${grp.id}Text`] });
                          if (res) setColors((c) => ({ ...c, [`${grp.id}Text`]: `text-${res}` }));
                        }}
                      >
                        Wählen
                      </button>
                      <div title={colors[`${grp.id}Text`]} className={`${colors[`${grp.id}Text`]} h-6 w-6 text-sm`}>Aa</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>}
          {/* <button
            onClick={async () => {
              const payload = { state, colors };
              if (window?.api?.saveData) {
                const res = await window.api.saveData(payload);
                if (!res || !res.ok) alert('Speichern fehlgeschlagen: ' + (res?.error || 'unknown'));
                else alert('Einstellungen gespeichert');
                return;
              }
              try {
                localStorage.setItem('247calender_data', JSON.stringify(payload));
                // const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                // const url = URL.createObjectURL(blob);
                // const a = document.createElement('a');
                // a.href = url;
                // a.download = '247calender_data.json';
                // a.click();
                // URL.revokeObjectURL(url);
                // alert('Einstellungen lokal gespeichert (localStorage) und JSON-Download erstellt');
              } catch (e) {
                alert('Speichern nicht möglich: ' + e.message);
              }
            }}
          >
            Speichern
          </button> */}
          {headerMenu == "einstellungenBackup" && <div className="flex flex-col gap-2 p-2 border rounded">
            <h4>Einstellungen</h4>
            <div className="flex flex-col gap-2">
              <div>
                <button onClick={async () => {
                  try {
                    // Use the preload API. It returns a Promise that resolves to the selected path or null.
                    const newPath = await window?.api?.showOpenDialogApi?.({ properties: ['openFile'] });
                    if (newPath) {
                      await window?.api?.setDataFilePath?.(newPath);
                      setDataFilePath(newPath);
                    }
                  } catch (err) {
                    console.warn('Open dialog failed', err);
                  }
                }}>Speicherdatei wählen</button>
                <span> Aktuell: {dataFilePath || 'nicht gesetzt'}</span>
              </div>

              <div>
                <button onClick={async () => {
                  const data = localStorage.getItem('247calender_data');
                  if (!data) {
                    alert('Keine Daten zum Herunterladen gefunden.');
                    return;
                  }
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = '247calender_data.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  Download
                </button>
                {/* Import JSON file (works in browser and Electron) */}
                <input id="import-file-input" type="file" accept="application/json" className="hidden" onChange={async (e) => {
                  const f = e.target.files && e.target.files[0];
                  if (!f) return;
                  try {
                    const text = await f.text();
                    const parsed = JSON.parse(text);
                    if (parsed.state) setState((s) => ({ ...s, ...parsed.state }));
                    if (parsed.colors) setColors((c) => ({ ...c, ...parsed.colors }));
                    // also support legacy saved JSON which might be the payload itself
                    if (!parsed.state && !parsed.colors) {
                      // attempt to interpret file as the full payload
                      if (parsed.DATA || parsed.menu) setState(parsed);
                      if (parsed.holidayBg || parsed.holidayBorder) setColors(parsed);
                    }
                    alert('Daten erfolgreich importiert');
                  } catch (err) {
                    alert('Import fehlgeschlagen: ' + (err?.message || String(err)));
                  } finally {
                    // reset input so same file can be re-imported if needed
                    e.target.value = '';
                  }
                }} />
                <button onClick={() => document.getElementById('import-file-input')?.click()}>Import</button>
              </div>
            </div>
          </div>}
        </div >
      </div >
      {colorSelector}
    </>
  );
}

function WorkdaysManager({ state, setState, persons, showColorSelector, showNewWorkday, setShowNewWorkday }) {
  const workdays = (state?.DATA?.workdays) || [];
  const [editIndex, setEditIndex] = useState(-1);
  // use a single ISO date string for browser date input
  const isoToday = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(isoToday);
  const [color, setColor] = useState("bg-green-300");
  const [name, setName] = useState("");
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(-1);
  const [special, setSpecial] = useState(false);

  const clearForm = () => {
    setEditIndex(-1);
    setDate(isoToday);
    setColor("bg-green-300");
    setName("");
    setSpecial(false);
    setShowNewWorkday(false);
  };

  const startEdit = (i) => {
    const w = workdays[i];
    if (!w) return;
    setEditIndex(i);
    // convert year/month/day to ISO date string
    const mm = String(w.month).padStart(2, '0');
    const dd = String(w.day).padStart(2, '0');
    setDate(`${w.year}-${mm}-${dd}`);
    setColor(w.color || "bg-green-300");
    setName(w.name || "");
    // try to match a person by name or color and adopt their index/color
    const pIdx = persons.findIndex((p) => (p.name && w.name && p.name === w.name) || (p.color && w.color && (p.color === w.color || `bg-${p.color}` === w.color)));
    setSelectedPersonIndex(pIdx >= 0 ? pIdx : -1);
    if (pIdx >= 0 && persons[pIdx] && persons[pIdx].color) {
      const pc = persons[pIdx].color;
      setColor(pc.startsWith('bg-') ? pc : `bg-${pc}`);
    }
    setSpecial(!!w.special);
    setShowNewWorkday(true);
  };

  const save = () => {
    // date is YYYY-MM-DD
    const [y, m, d] = (date || isoToday).split('-').map((s) => Number(s));
    const newW = { year: y, month: m, day: d, color, name, special };
    const newWorkdays = [...workdays];
    if (editIndex >= 0 && editIndex < newworkdays?.length) newWorkdays[editIndex] = newW;
    else newworkdays?.push(newW);
    setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWorkdays } }));
    clearForm();
  };

  const remove = (i) => {
    const newWorkdays = workdays?.filter((_, idx) => idx !== i);
    setState((s) => ({ ...s, DATA: { ...s.DATA, workdays: newWorkdays } }));
    clearForm();
  };

  return (
    <div className="mt-2">
      {showNewWorkday && (
        <div className="bg-green-50 p-2 border rounded">
          <div className="flex items-center gap-2">
            <input type="date" className="p-1 border rounded" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex items-center gap-2">
              <div className="mr-2">Person:</div>
              <select value={selectedPersonIndex} onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedPersonIndex(idx);
                if (idx >= 0 && persons[idx]) {
                  setName(persons[idx].name);
                  const pc = persons[idx].color || '';
                  // ensure stored color is a bg-... class
                  setColor(pc.startsWith('bg-') || pc.startsWith('border-') ? pc : (pc ? `bg-${pc}` : pc));
                } else setName('');
              }} className="p-1 border rounded">
                <option value={-1}>-- eigener Name --</option>
                {persons.map((p, i) => (<option key={i} value={i}>{p.name}</option>))}
              </select>
            </div>
            {/* <input className="flex-1 p-1 border rounded" value={name} onChange={(e) => { setName(e.target.value); setSelectedPersonIndex(-1); }} placeholder="Name (oder wähle Person)" />
            <input disabled className="p-1 border rounded w-36" value={color} /> */}
            {/* <button onClick={async () => { const res = await showColorSelector({ top: 100, left: 100, selectedColor: color }); if (res) setColor(`bg-${res}`); }}>Farbe</button> */}
            <label className="flex items-center gap-1"><input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} /> Spezial</label>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={save}>{editIndex >= 0 ? 'Update' : 'Speichern'}</button>
            <button onClick={clearForm}>Abbrechen</button>
          </div>
        </div>
      )}
      <div className="mt-2">
        {workdays?.length === 0 && <div className="text-gray-500 text-xs">Keine Arbeitstage</div>}
        {workdays?.map((w, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b">
            <div className="flex-1">{w.year}-{w.month}-{w.day} {w.name} <span className="text-gray-500 text-xs">{w.color}</span> {w.special ? '(Spezial)' : ''}</div>
            <button onClick={() => startEdit(i)}>Edit</button>
            <button onClick={() => remove(i)}>Löschen</button>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ColorSelector({ top = 0, left = 0, selectedColor, onResolve }) {
  const move = (moveId) => (e) => {
    // handle mouse down and drag window(div)
    const div = document.getElementById(moveId);
    const offset = { x: e.clientX - div.getBoundingClientRect().left, y: e.clientY - div.getBoundingClientRect().top };
    const mouseMoveHandler = (e) => {
      div.style.left = `${e.clientX - offset.x}px`;
      div.style.top = `${e.clientY - offset.y}px`;
    };
    const mouseUpHandler = () => {
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };
  // ensure CSS values include units when provided as numbers
  const styleTop = typeof top === "number" ? `${top}px` : top;
  const styleLeft = typeof left === "number" ? `${left}px` : left;

  return (
    <div
      id="move1"
      className={`z-50 absolute bg-white shadow border rounded`}
      style={{ top: styleTop, left: styleLeft }}
    >
      <div onMouseDown={move("move1")} className="bg-gray-300 border-b rounded-t cursor-move select-none">
        <div className="flex justify-between gap-3 ps-1">
          <h2 className="font-bold">Farbauswahl</h2>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onResolve(selectedColor);
            }}
            className="flex justify-center items-center bg-red-300 rounded h-6 aspect-square text-red-500 cursor-pointer"
          >
            ❌
          </div>
        </div>
      </div>
      <div className="grid grid-rows-10">
        {getTailwindColors().gradations.map((g) => {
          return (
            <div key={g} className="items-center grid grid-cols-23">
              <div>{g}</div>
              {getTailwindColors().colors.map((colorData) => {
                return (
                  <div
                    onClick={() => {
                      onResolve(`${colorData.name}-${g}`);
                    }}
                    key={colorData.name}
                    title={colorData.de + " (" + colorData.name + ")"}
                    className={`cursor-pointer h-4 w-4 border bg-${colorData.name}-${g}`}
                  ></div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function useColorSelector() {
  const [colorSelector, setColorSelector] = useState(null);
  const showColorSelector = useCallback(({ top, left, selectedColor }) => {
    return new Promise((resolve) => {
      setColorSelector(
        <ColorSelector
          top={top}
          left={left}
          selectedColor={selectedColor}
          onResolve={(color) => {
            setColorSelector(null);
            resolve(color);
          }}
        />
      );
    });
  }, []);
  return [colorSelector, showColorSelector];
}
export default function Calendar() {
  const [shot, setShot] = useState({ shot: false, target: "calendar" });
  const [shotTarget, setShotTarget] = useState("calendar");
  const [year, setYear] = useState(new Date().getFullYear());
  const [state, setState] = useState({});
  const [colors, setColors] = useState({
    holidayBg: "bg-orange-500",
    holidayBorder: "border-orange-500",
    holidayText: "text-orange-500",
    vacationBg: "bg-yellow-500",
    vacationBorder: "border-yellow-500",
    vacationText: "text-yellow-500",
    attentionBg: "bg-red-500",
    attentionBorder: "border-red-500",
    attentionText: "text-red-500",
  });

  // Load saved data on mount (Electron environment)
  useEffect(() => {
    const tryLoad = async () => {
      try {
        // prefer Electron preload API
        if (window?.api?.loadData) {
          const data = await window.api.loadData();
          if (data && !data.__error) {
            if (data.state) setState((s) => ({ ...s, ...data.state }));
            if (data.colors) setColors((c) => ({ ...c, ...data.colors }));
            return;
          }
        }
        // fallback: try localStorage (useful in browser / dev)
        try {
          const raw = localStorage.getItem('247calender_data');
          if (raw) {
            const data = JSON.parse(raw);
            if (data.state) setState((s) => ({ ...s, ...data.state }));
            if (data.colors) setColors((c) => ({ ...c, ...data.colors }));
          }
        } catch (e) {
          // ignore parse errors
        }
      } catch (e) {
        // ignore errors
      }
    };
    tryLoad();
  }, []);

  // autosave on changes to state or colors (debounced, skip initial load)
  const saveTimerRef = useRef(null);
  const initialLoadedRef = useRef(false);
  useEffect(() => {
    // mark that initial load happened after first render
    if (!initialLoadedRef.current) {
      initialLoadedRef.current = true;
      return;
    }
    // debounce saves
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload = { state, colors };
      try {
        if (window?.api?.saveData) {
          await window.api.saveData(payload);
        } else {
          localStorage.setItem('247calender_data', JSON.stringify(payload));
        }
      } catch (e) {
        // ignore save errors for now
        console.error('Autosave failed', e);
      }
    }, 250);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, colors]);

  return (
    <>
      <div className="flex flex-col min-h-0 overflow-hidden">
        <nav className="flex flex-none justify-center items-center gap-2 p-1 min-h-0">
          <div className="border rounded">
            <button
              onClick={() => {
                setState({ ...state, menu: { active: "calendar" } });
              }}
              className={state?.menu?.active === "calendar" ? "!border-amber-500" : ""}
            >
              Kalender
            </button>
          </div>
          <div className="flex items-center gap-1 border rounded">
            <button className="flex items-center" onClick={() => setYear(year - 1)}>
              -
            </button>
            <div className="font-bold">{year}</div>
            <button className="flex items-center" onClick={() => setYear(year + 1)}>
              +
            </button>
          </div>
          <div
            className={`flex border rounded items-center ${state?.menu?.active === "calendar" ? "opacity-100" : "opacity-30"
              }`}
          >
            <select
              disabled={!state?.menu?.active === "calendar"}
              className="mx-[2px]"
              value={shotTarget}
              onChange={(e) => setShotTarget(e.target.value)}
            >
              <option value="calendar">Jahr</option>
              <option value="m-0">Januar</option>
              <option value="m-1">Februar</option>
              <option value="m-2">März</option>
              <option value="m-3">April</option>
              <option value="m-4">Mai</option>
              <option value="m-5">Juni</option>
              <option value="m-6">Juli</option>
              <option value="m-7">August</option>
              <option value="m-8">September</option>
              <option value="m-9">Oktober</option>
              <option value="m-10">November</option>
              <option value="m-11">Dezember</option>
            </select>
            <button
              onClick={() => {
                if (state?.menu?.active === "calendar") {
                  setShot({ shot: true, target: shotTarget });
                }
              }}
              disabled={!state?.menu?.active === "calendar"}
            >
              Screenshot
            </button>
          </div>
          <div className="border rounded">
            <button
              onClick={() => {
                setState({ ...state, menu: { active: "settings" } });
              }}
              className={state?.menu?.active === "settings" ? "!border-amber-500" : ""}
            >
              Einstellungen
            </button>
          </div>
        </nav>
        <main className="flex min-h-0 overflow-hidden">
          {!state?.menu?.active || state?.menu?.active === "calendar" && (
            <CalendarGrid
              colors={colors}
              shot={shot}
              setShot={setShot}
              holidays={state?.DATA?.holidays}
              vacations={state?.DATA?.vacations}
              persons={state?.DATA?.persons}
              workdays={state?.DATA?.workdays}
              year={year}
              setYear={setYear}
            />
          )}
          {state?.menu?.active === "settings" && (
            <CalendarSettings colors={colors} setColors={setColors} state={state} setState={setState} />
          )}
        </main>
      </div>
    </>
  );
}
