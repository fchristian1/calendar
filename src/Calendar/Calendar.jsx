import html2canvas from "html2canvas-pro";
import { useCallback, useEffect, useState } from "react";
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
export function CalendarGrid({ colors, workdays, shot, setShot, year, setYear }) {
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
        <CalendarHeader colors={colors} />
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
              <div id={"m-" + month}>
                <div className={` ${shot.shot && shot.target != "calendar" ? "m-1" : ""} `}>
                  {shot.shot && shot.target != "calendar" && <CalendarHeader colors={colors} shot={shot.shot} />}
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
                              const workdayObj = workdays.find((w) => w.year === year && w.month === m && w.day === d);
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

function CalendarHeader({ shot = false, colors }) {
  return (
    <div className={`flex ${shot ? "flex-col" : "flex-row"} gap-1 mb-[1px]`}>
      <div className="flex gap-1 p-1 border rounded">
        <div className="flex gap-1">
          <span>Ferien</span>
          <div className={`h-6 aspect-square border-2 ${colors.vacationBorder} rounded`}></div>
        </div>
        <div className="flex gap-1">
          <span>Feiertag</span>
          <div className={`h-6 aspect-square border-2 ${colors.holidayBorder} rounded`}></div>
        </div>
      </div>
      <div className={`flex ${shot ? " flex-col " : " flex-row "} gap-1 p-1 border rounded`}>
        <div className="flex gap-1">
          <span>Achtung!</span>
          <div className={`h-6 aspect-square border-2 rounded`}>
            <div className={`border-2 ${colors.attentionBorder} w-full h-full`}></div>
          </div>
        </div>
        <div className="flex gap-1">
          <span>Christian</span>
          <div className={`h-6 aspect-square border-2 bg-green-300 rounded`}></div>
        </div>
        <div className="flex gap-1">
          <span>Dennis</span>
          <div className={`h-6 aspect-square border-2 bg-blue-300 rounded`}></div>
        </div>
      </div>
    </div>
  );
}

export function CalendarSettings({ colors, setColors, state, setState }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorSelector, showColorSelector] = useColorSelector();

  const handleClickShowSelector = async () => {
    // pass numeric coordinates (px will be appended in the selector)
    const result = await showColorSelector({ top: 100, left: 100, selectedColor });
    setSelectedColor(result);
  };
  return (
    <>
      <div>
        <h2 className="font-bold">Kalender Einstellungen</h2>
        <div className="flex gap-2">
          <div className="h-4 aspect-square text-nowrap">{selectedColor ?? "null"}</div>
          <button onClick={handleClickShowSelector}>Sel</button>
          <button
            onClick={async () => {
              // save current settings and data to disk via preload API
              if (window?.api?.saveData) {
                const payload = { state, colors };
                const res = await window.api.saveData(payload);
                if (!res || !res.ok) alert('Speichern fehlgeschlagen: ' + (res?.error || 'unknown'));
                else alert('Einstellungen gespeichert');
              } else {
                alert('Save API nicht verfügbar');
              }
            }}
          >
            Speichern
          </button>
        </div>
      </div>
      {colorSelector}
    </>
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
            <div key={g} className="grid grid-cols-22">
              {getTailwindColors().colors.map((colorData) => {
                return (
                  <div
                    onClick={() => {
                      onResolve(`${colorData.name}-${g}`);
                    }}
                    key={colorData.name}
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
  const [state, setState] = useState({
    menu: {
      active: "calendar",
    },
    DATA: {
      workdays: [
        { year: 2025, month: 1, day: 1, color: "bg-blue-300", name: "Dennis", special: true },
        { year: 2025, month: 1, day: 11, color: "bg-blue-300", name: "Dennis", special: false },
        { year: 2025, month: 1, day: 12, color: "bg-blue-300", name: "Dennis", special: false },
        { year: 2025, month: 1, day: 18, color: "bg-green-300", name: "Christian", special: false },
        { year: 2025, month: 1, day: 19, color: "bg-green-300", name: "Christian", special: false },
        { year: 2025, month: 1, day: 25, color: "bg-blue-300", name: "Dennis", special: false },
        { year: 2025, month: 1, day: 26, color: "bg-blue-300", name: "Dennis", special: false },
        { year: 2025, month: 2, day: 1, color: "bg-blue-300", name: "Dennis", special: true },
        { year: 2025, month: 2, day: 2, color: "bg-green-300", name: "Christian", special: false },
      ],
    },
  });
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
        if (window?.api?.loadData) {
          const data = await window.api.loadData();
          if (data && !data.__error) {
            if (data.state) setState((s) => ({ ...s, ...data.state }));
            if (data.colors) setColors((c) => ({ ...c, ...data.colors }));
          }
        }
      } catch (e) {
        // ignore
      }
    };
    tryLoad();
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-0 overflow-hidden">
        <nav className="flex flex-none justify-center items-center gap-2 p-1 min-h-0">
          <div className="border rounded">
            <button
              onClick={() => {
                setState({ ...state, menu: { active: "calendar" } });
              }}
              className={state.menu.active === "calendar" ? "!border-amber-500" : ""}
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
            className={`flex border rounded items-center ${state.menu.active === "calendar" ? "opacity-100" : "opacity-30"
              }`}
          >
            <select
              disabled={!state.menu.active === "calendar"}
              className="mx-[2px]"
              value={shotTarget}
              onChange={(e) => setShotTarget(e.target.value)}
            >
              <option selected={shotTarget === "calendar"} value="calendar">
                Jahr
              </option>
              <option selected={shotTarget === "m-0"} value="m-0">
                Januar
              </option>
              <option selected={shotTarget === "m-1"} value="m-1">
                Februar
              </option>
              <option selected={shotTarget === "m-2"} value="m-2">
                März
              </option>
              <option selected={shotTarget === "m-3"} value="m-3">
                April
              </option>
              <option selected={shotTarget === "m-4"} value="m-4">
                Mai
              </option>
              <option selected={shotTarget === "m-5"} value="m-5">
                Juni
              </option>
              <option selected={shotTarget === "m-6"} value="m-6">
                Juli
              </option>
              <option selected={shotTarget === "m-7"} value="m-7">
                August
              </option>
              <option selected={shotTarget === "m-8"} value="m-8">
                September
              </option>
              <option selected={shotTarget === "m-9"} value="m-9">
                Oktober
              </option>
              <option selected={shotTarget === "m-10"} value="m-10">
                November
              </option>
              <option selected={shotTarget === "m-11"} value="m-11">
                Dezember
              </option>
            </select>
            <button
              onClick={() => {
                if (state.menu.active === "calendar") {
                  setShot({ shot: true, target: shotTarget });
                }
              }}
              disabled={!state.menu.active === "calendar"}
            >
              Screenshot
            </button>
          </div>
          <div className="border rounded">
            <button
              onClick={() => {
                setState({ ...state, menu: { active: "settings" } });
              }}
              className={state.menu.active === "settings" ? "!border-amber-500" : ""}
            >
              Einstellungen
            </button>
          </div>
        </nav>
        <main className="flex min-h-0 overflow-hidden">
          {state.menu.active === "calendar" && (
            <CalendarGrid
              colors={colors}
              shot={shot}
              setShot={setShot}
              holidays={state.DATA.holidays}
              vacations={state.DATA.vacations}
              workdays={state.DATA.workdays}
              year={year}
              setYear={setYear}
            />
          )}
          {state.menu.active === "settings" && (
            <CalendarSettings colors={colors} setColors={setColors} state={state} setState={setState} />
          )}
        </main>
      </div>
    </>
  );
}
