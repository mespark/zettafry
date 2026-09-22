import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, X } from "lucide-react";

/** Live camera sheet: capture a photo and hand it back as a JPEG data URL. */
export function CameraCapture({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (photo: { name: string; data: string }) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [shot, setShot] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setReady(false);
    setShot(null);

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This browser does not support camera capture");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message.includes("Permission") || err.name === "NotAllowedError"
              ? "Camera permission denied — allow access and try again"
              : err.message
            : "Could not open the camera",
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  if (!open) return null;

  const take = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
  };

  const use = () => {
    if (!shot) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    onCapture({ name: `camera-${stamp}.jpg`, data: shot });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Camera className="size-4 text-primary" />
          <p className="font-display text-sm">Capture invoice</p>
          <button
            aria-label="Close camera"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-secondary/40">
          {error ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-destructive">
              {error}
            </div>
          ) : shot ? (
            <img src={shot} alt="Captured invoice" className="h-full w-full object-contain" />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {shot ? (
            <>
              <button
                onClick={() => setShot(null)}
                className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Retake
              </button>
              <button
                onClick={use}
                className="ml-auto rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-shadow hover:shadow-[0_0_24px_var(--glow)]"
              >
                Attach photo
              </button>
            </>
          ) : (
            <>
              <button
                aria-label="Switch camera"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <RefreshCw className="size-4" />
              </button>
              <button
                onClick={take}
                disabled={!ready}
                className="mx-auto rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground transition-shadow hover:shadow-[0_0_24px_var(--glow)] disabled:opacity-40"
              >
                Take photo
              </button>
              <span className="w-9" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
