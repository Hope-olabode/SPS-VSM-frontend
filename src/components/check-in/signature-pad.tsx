"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";

// The pad is always "paper": white background with dark ink, in light and dark mode,
// so the saved signature image looks the same everywhere.
const INK = "#111827";
const HEIGHT = 180;

type SignaturePadProps = {
  /** Saved signature as a PNG data URL, or null when empty */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
};

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialValue = useRef(value);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));

  // Size the canvas for sharp lines on high-DPI screens, restore any saved signature,
  // and keep the drawing when the width changes (rotating a phone, resizing the window).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = (restore: string | null) => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.getBoundingClientRect().width;
      if (!width) return;

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(HEIGHT * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = INK;

      if (restore) {
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, width, HEIGHT);
        image.src = restore;
      }
    };

    fit(initialValue.current);

    let lastWidth = canvas.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const width = canvas.getBoundingClientRect().width;
      if (width === lastWidth) return;
      lastWidth = width;
      fit(canvas.toDataURL()); // snapshot first: resizing a canvas wipes it
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  function pointFrom(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;

    const { x, y } = pointFrom(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01); // a tap leaves a dot
    ctx.stroke();
    setHasInk(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;

    const { x, y } = pointFrom(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function finishStroke(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    setHasInk(false);
    onChange(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold">
          Visitor Signature <span className="text-red-500">*</span>
        </span>
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk}
          className="text-xs font-medium text-brand hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-line-strong bg-white">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature pad. Draw your signature here."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className="block h-[180px] w-full cursor-crosshair touch-none"
        />

        {/* Guides (not part of the saved image) */}
        <span aria-hidden="true" className="pointer-events-none absolute bottom-9 left-5 text-lg leading-none text-slate-400">
          ×
        </span>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-8 border-b border-dashed border-slate-300" />
        {!hasInk && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-400">
            Sign here
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] text-muted">Use a finger, stylus or mouse to sign in the box above.</p>
    </div>
  );
}