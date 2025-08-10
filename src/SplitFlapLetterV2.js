import React, { useEffect, useRef, useState } from "react";

/* tiny click */
let audioCtx = null;
function clickTick() {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "square";
    o.frequency.value = 900;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    o.start(t);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.stop(t + 0.03);
  } catch {}
}

const WHEEL = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:/-";

export default function SplitFlapLetterV2({ value = " " }) {
  const [cur, setCur] = useState(" ");
  const [nxt, setNxt] = useState(" ");
  const [phase, setPhase] = useState("idle"); // idle | folding | unfolding
  const queue = useRef([]);

  // build queue when value changes
  useEffect(() => {
    const target = WHEEL.includes(value) ? value : " ";
    if (phase === "idle" && target === cur) return;

    let i = WHEEL.indexOf(cur);
    const t = WHEEL.indexOf(target);
    const steps = [];
    while (i !== t) {
      i = (i + 1) % WHEEL.length;
      steps.push(WHEEL[i]);
    }
    queue.current = steps;
    if (phase === "idle") startStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function startStep() {
    if (!queue.current.length) {
      setPhase("idle");
      setNxt(cur);
      return;
    }
    const nextChar = queue.current.shift();
    setNxt(nextChar);
    setPhase("folding");
    clickTick();
  }
  function onTopEnd() {
    if (phase !== "folding") return;
    setPhase("unfolding");
    clickTick();
  }
  function onBottomEnd() {
    if (phase !== "unfolding") return;
    setCur(nxt);
    setPhase("idle");
    setNxt(nxt);
    setTimeout(startStep, 15);
  }

  const bottomChar = phase === "folding" || phase === "unfolding" ? nxt : cur;

  return (
    <div className="s2-tile">
      <style>{`
        .s2-tile{display:inline-block;width:1.15ch;height:2.2rem;margin:2px;perspective:600px}
        .s2-card{position:relative;width:100%;height:100%;border-radius:4px;
          background:linear-gradient(#1a1a1a,#0f0f0f);
          box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 -1px 0 rgba(0,0,0,.6) inset,0 2px 8px rgba(0,0,0,.6);
          overflow:hidden}
        .s2-card:after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;
          background:linear-gradient(to bottom,rgba(255,255,255,.10),rgba(0,0,0,.7));
          transform:translateY(-.5px);box-shadow:0 -1px 0 rgba(0,0,0,.7),0 1px 0 rgba(0,0,0,.7)}
        .s2-half{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:center;
          font:700 2rem/1 monospace;color:#fff;background:linear-gradient(#1a1a1a,#0f0f0f);
          backface-visibility:hidden;transform-style:preserve-3d;overflow:hidden}
        .s2-top{top:0;height:50%;transform:rotateX(0deg);transform-origin:bottom center;border-top-left-radius:4px;border-top-right-radius:4px}
        .s2-bottom{bottom:0;height:50%;transform:rotateX(0deg);transform-origin:top center;border-bottom-left-radius:4px;border-bottom-right-radius:4px}
        .s2-top.s2-fold{animation:s2Top 120ms linear forwards}
        .s2-bottom.s2-unfold{animation:s2Bottom 120ms linear forwards}
        @keyframes s2Top{from{transform:rotateX(0)}to{transform:rotateX(-90deg)}}
        @keyframes s2Bottom{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}
        /* center glyphs nicely in halves */
        .s2-top span{transform:translateY(-2px)}
        .s2-bottom span{transform:translateY(-2px)}
      `}</style>

      <div className="s2-card">
        <div
          className={`s2-half s2-top ${phase === "folding" ? "s2-fold" : ""}`}
          onAnimationEnd={onTopEnd}
        >
          <span>{cur}</span>
        </div>
        <div
          className={`s2-half s2-bottom ${
            phase === "unfolding" ? "s2-unfold" : ""
          }`}
          onAnimationEnd={onBottomEnd}
          style={
            phase === "folding" ? { transform: "rotateX(90deg)" } : undefined
          }
        >
          <span>{bottomChar}</span>
        </div>
      </div>
    </div>
  );
}
