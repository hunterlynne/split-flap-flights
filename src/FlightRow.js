import React from "react";
import SplitFlapLetter from "./SplitFlapLetter";

function renderWord(word, length) {
  const padded = String(word || "")
    .toUpperCase()
    .padEnd(length, " ");
  return padded
    .split("")
    .map((ch, i) => <SplitFlapLetter key={i} value={ch} />);
}

export default function FlightRow({ flight, origin, time, gate, status }) {
  return (
    <div className="row">
      <div className="col-flight">{renderWord(flight, 8)}</div>
      <div className="col-origin">{renderWord(origin, 15)}</div>
      <div className="col-time">{renderWord(time, 6)}</div>
      <div className="col-gate">{renderWord(gate, 5)}</div>
      <div className="col-status">{renderWord(status, 10)}</div>
    </div>
  );
}
