const STATUSES = ["ON TIME", "DELAYED", "BOARDING", "ARRIVED", "CANCELED"];

/* ---------- MOCK DATA (fallback + local dev) ---------- */
export function getFlightsMock(prev = []) {
  if (!prev || prev.length === 0) {
    return [
      { flight: "UA118", origin: "CHICAGO", time: "14:40", gate: "B12", status: "ON TIME" },
      { flight: "DL202", origin: "ATLANTA", time: "14:55", gate: "C3",  status: "DELAYED" },
      { flight: "BA292", origin: "LONDON",  time: "15:05", gate: "B12", status: "BOARDING" },
      { flight: "AF054", origin: "PARIS",   time: "15:16", gate: "X1",  status: "ARRIVED" },
      { flight: "AC761", origin: "TORONTO", time: "15:23", gate: "C9",  status: "ON TIME" }
    ];
  }
  return randomDrift(prev);
}

export function getDeparturesMock(prev = []) {
  if (!prev || prev.length === 0) {
    return [
      { flight: "UA927", origin: "LONDON",   time: "16:10", gate: "C3",  status: "BOARDING" },
      { flight: "AA101", origin: "NEW YORK", time: "16:25", gate: "B7",  status: "ON TIME" },
      { flight: "AF055", origin: "PARIS",    time: "16:40", gate: "D11", status: "DELAYED" },
      { flight: "DL404", origin: "BOSTON",   time: "17:05", gate: "A4",  status: "ON TIME" },
      { flight: "BA216", origin: "LONDON",   time: "17:20", gate: "C9",  status: "ON TIME" }
    ];
  }
  return randomDrift(prev);
}

/* ---------- LIVE via Netlify function ---------- */
export async function getFlightsLive({ proxyUrl, airport = "IAD", mode = "arrivals" }) {
  const url = `${proxyUrl}?airport=${encodeURIComponent(airport)}&type=${encodeURIComponent(mode)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

/* ---------- helpers ---------- */
function randomDrift(list) {
  return list.map((f) => {
    const roll = Math.random();
    if (roll < 0.25) {
      return { ...f, status: STATUSES[Math.floor(Math.random() * STATUSES.length)] };
    } else if (roll < 0.35) {
      const gates = ["A1", "B4", "B12", "C3", "C9", "D7", "D11", "E5", "X1"];
      return { ...f, gate: gates[Math.floor(Math.random() * gates.length)] };
    } else if (roll < 0.45) {
      return { ...f, time: driftTime(f.time) };
    }
    return f;
  });
}

function driftTime(hhmm) {
  if (!/^\d{2}:\d{2}$/.test(hhmm || "")) return "--:--";
  const [hh, mm] = hhmm.split(":").map((n) => parseInt(n, 10));
  const offset = Math.floor(Math.random() * 11) - 5; // -5..+5
  let mins = hh * 60 + mm + offset;
  if (mins < 0) mins += 24 * 60;
  mins = mins % (24 * 60);
  const H = String(Math.floor(mins / 60)).padStart(2, "0");
  const M = String(mins % 60).padStart(2, "0");
  return `${H}:${M}`;
}
