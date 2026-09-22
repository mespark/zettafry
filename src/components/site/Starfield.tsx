import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number };

export function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let stars: Star[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      stars = Array.from({ length: 260 }, () => ({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (const star of stars) {
        star.z -= 1.1;
        if (star.z <= 1) star.z = canvas.width;
        const k = 128 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;
        if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) continue;
        const size = (1 - star.z / canvas.width) * 2.2 * dpr;
        ctx.fillStyle = `rgba(160, 240, 255, ${(1 - star.z / canvas.width) * 0.7})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(size, 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}