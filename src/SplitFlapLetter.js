import React, { useState, useEffect } from "react";
import "./styles.css";

/* Quiet click using Web Audio */
let audioCtx = null;
function playClick() {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 900;
    gain.gain.value = 0.05;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.start(now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.stop(now + 0.03);
  } catch {
    /* autoplay might be blocked until user interacts */
  }
}

/* Character wheel */
const CHARACTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:/-";

// Helper: get a random int between min and max (inclusive)
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export default function SplitFlapLetter({ value }) {
  const [displayChar, setDisplayChar] = useState(" ");
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    const safeValue = CHARACTERS.includes(value) ? value : " ";
    if (safeValue === displayChar) return;

    // Build the stepping sequence from current -> target
    setFlipping(true);
    let currentIndex = CHARACTERS.indexOf(displayChar);
    const targetIndex = CHARACTERS.indexOf(safeValue);
    const steps = [];
    while (currentIndex !== targetIndex) {
      currentIndex = (currentIndex + 1) % CHARACTERS.length;
      steps.push(CHARACTERS[currentIndex]);
    }

    let i = 0;
    let cancelled = false;

    // Small random delay before this tile starts, so different letters don’t flap in perfect sync
    const startDelay = rand(0, 60);

    const tick = () => {
      if (cancelled) return;
      setDisplayChar(steps[i]);
      if (i % 2 === 0) playClick(); // click every other flap
      i++;

      if (i >= steps.length) {
        // add a tiny "settle" pause at the end
        setTimeout(() => !cancelled && setFlipping(false), rand(40, 100));
        return;
      }

      // Jitter: each flap step takes slightly different time (35–90ms)
      const nextDelay = rand(35, 90);
      setTimeout(tick, nextDelay);
    };

    const kickoff = setTimeout(tick, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(kickoff);
    };
  }, [value, displayChar]);

  return (
    <span className={`splitflap ${flipping ? "flipping" : ""}`}>
      {displayChar}
    </span>
  );
}
