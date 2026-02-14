import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export default function AudioVisualizer({
  isActive,
  color = "#6366f1",
  barCount = 20,
  height = 60,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>(new Array(barCount).fill(0));
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height: h } = canvas;
      ctx.clearRect(0, 0, width, h);

      const barWidth = width / barCount - 2;

      barsRef.current = barsRef.current.map((bar) => {
        if (isActive) {
          const target = Math.random() * h * 0.9;
          return bar + (target - bar) * 0.15;
        }
        return bar * 0.9;
      });

      barsRef.current.forEach((barHeight, i) => {
        const x = i * (barWidth + 2);
        const y = h - barHeight;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
