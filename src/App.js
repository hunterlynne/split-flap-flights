import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./styles.css";
import FlightRow from "./FlightRow";
import { getFlightsMock, getDeparturesMock, getFlightsLive } from "./flightService";

const PAGE_SIZE = 15;       // ← change to 8 or 10 if you prefer
const ROTATE_MS = 7000;    // ← how often to change pages

const USE_LIVE = true;     // leave true to use your Netlify function
const PROXY_URL = "https://split-flap-flights.netlify.app/.netlify/functions/flights"; // <-- set this!

export default function App() {
  const [mode, setMode] = useState("arrivals"); // "arrivals" | "departures"
  const [flights, setFlights] = useState([]);
  const [page, setPage] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Load when mode changes
  useEffect(() => {
    if (USE_LIVE) {
      getFlightsLive({ proxyUrl: PROXY_URL, airport: "IAD", mode })
        .then(setFlights)
        .catch(() =>
          setFlights(mode === "arrivals" ? getFlightsMock([]) : getDeparturesMock([]))
        );
    } else {
      setFlights(mode === "arrivals" ? getFlightsMock([]) : getDeparturesMock([]));
    }
    setPage(0); // reset to first page on mode switch
  }, [mode]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (USE_LIVE) {
        getFlightsLive({ proxyUrl: PROXY_URL, airport: "IAD", mode })
          .then(setFlights)
          .catch(() =>
            setFlights(prev =>
              mode === "arrivals" ? getFlightsMock(prev) : getDeparturesMock(prev)
            )
          );
      } else {
        setFlights(prev =>
          mode === "arrivals" ? getFlightsMock(prev) : getDeparturesMock(prev)
        );
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [mode]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(flights.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const visible = flights.slice(start, start + PAGE_SIZE);

  // Auto-rotate pages (pause on hover)
  const hoverRef = useRef(false);
  useEffect(() => {
    if (!autoRotate || totalPages <= 1) return;
    const t = setInterval(() => {
      if (!hoverRef.current) setPage(p => (p + 1) % totalPages);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [autoRotate, totalPages]);

  // ----- Auto-fit board scaling + tile measurement (to keep one-line rows) -----
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Measure tile width and expose as --tilew
  useLayoutEffect(() => {
    const measureTile = () => {
      const el = document.querySelector(".board .splitflap");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const ml = parseFloat(cs.marginLeft) || 0;
      const mr = parseFloat(cs.marginRight) || 0;
      const tilew = rect.width + ml + mr;
      document.documentElement.style.setProperty("--tilew", `${tilew}px`);
    };
    measureTile();
    window.addEventListener("resize", measureTile);
    return () => window.removeEventListener("resize", measureTile);
  }, []);

  // Fit the board to the container width
  useLayoutEffect(() => {
    if (!containerRef.current || !innerRef.current) return;

    const updateScale = () => {
      const cw = containerRef.current.clientWidth;
      innerRef.current.style.transform = "scale(1)";
      const iw = innerRef.current.scrollWidth || 1;
      const s = Math.min(1, cw / iw);
      setScale(s);
      const ih = innerRef.current.scrollHeight || 0;
      containerRef.current.style.height = `${ih * s}px`;
    };

    const ro1 = new ResizeObserver(updateScale);
    const ro2 = new ResizeObserver(updateScale);
    ro1.observe(containerRef.current);
    ro2.observe(innerRef.current);
    window.addEventListener("resize", updateScale);
    updateScale();

    return () => {
      ro1.disconnect();
      ro2.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [visible.length, page, mode]);

  const total = flights.length;
  const goPrev = () => setPage(p => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage(p => (p + 1) % totalPages);

  return (
    <div className="App" style={{ padding: 24 }}>
      {/* Title + toggle */}
      <div className="toolbar">
        <h1>{mode === "arrivals" ? "Arrivals" : "Departures"} — DULLES (IAD)</h1>
        <div className="controls">
          <button onClick={() => setMode("arrivals")} disabled={mode === "arrivals"}>
            Arrivals
          </button>
          <button onClick={() => setMode("departures")} disabled={mode === "departures"}>
            Departures
          </button>
          <span className="spacer" />
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            Auto-rotate
          </label>
          <span className="spacer" />
          <small>{total} flights</small>
        </div>
      </div>

      {/* Column headers */}
      <div className="headers">
        <div className="col-flight">FLIGHT</div>
        <div className="col-origin">{mode === "arrivals" ? "ORIGIN" : "DESTINATION"}</div>
        <div className="col-time">TIME</div>
        <div className="col-gate">GATE</div>
        <div className="col-status">STATUS</div>
      </div>

      {/* Scaled board wrapper */}
      <div
        className="board-fit-container"
        ref={containerRef}
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
      >
        <div
          ref={innerRef}
          className="board"
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {visible.map((f, i) => (
            <FlightRow key={`${mode}-${f.flight}-${start + i}`} {...f} />
          ))}
        </div>
      </div>

      {/* Pager */}
      {totalPages > 1 && (
        <div className="pager">
          <button onClick={goPrev} aria-label="Previous page">◀</button>
          <div className="dots">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`dot ${i === page ? "active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
          <button onClick={goNext} aria-label="Next page">▶</button>
        </div>
      )}
    </div>
  );
}
