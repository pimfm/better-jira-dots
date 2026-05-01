// Working-day counting. Exposed at window.BJD.workdays.

(function () {
  "use strict";

  // Returns the number of working days elapsed between `from` (inclusive) and `to` (inclusive),
  // counting only days where workingDaysMask[dayOfWeek] is true. Sun=0, Sat=6.
  // Uses local time so a card that moved at 23:55 on Friday still shows 0 working days on Saturday.
  function countWorkingDays(from, to, workingDaysMask) {
    if (!(from instanceof Date) || !(to instanceof Date)) return 0;
    if (to <= from) return 0;
    if (!Array.isArray(workingDaysMask) || workingDaysMask.length !== 7) {
      workingDaysMask = [false, true, true, true, true, true, false];
    }

    const start = startOfDay(from);
    const end = startOfDay(to);
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((end - start) / msPerDay);

    if (totalDays <= 0) return 0;

    // Fast path: count weeks then handle the remainder.
    const weeklyWorkdays = workingDaysMask.reduce((sum, on) => sum + (on ? 1 : 0), 0);
    if (weeklyWorkdays === 0) return 0;

    const fullWeeks = Math.floor(totalDays / 7);
    const remainder = totalDays % 7;

    let count = fullWeeks * weeklyWorkdays;

    let dow = start.getDay();
    for (let i = 0; i < remainder; i++) {
      if (workingDaysMask[dow]) count += 1;
      dow = (dow + 1) % 7;
    }

    return count;
  }

  function startOfDay(date) {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const ns = (window.BJD = window.BJD || {});
  ns.workdays = { countWorkingDays };
})();
