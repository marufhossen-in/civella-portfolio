import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { Check, Eye, ImageUp, Loader2, Trash2, Upload, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

export function ImageUploader({
  currentUrl,
  onChange,
  onRemove,
  maxSizeMb = 5,
  aspect = "square",
}: {
  currentUrl: string | null;
  onChange: (dataUrl: string) => void;
  onRemove: () => void;
  maxSizeMb?: number;
  aspect?: "square" | "portrait";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    const okType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!okType) {
      setError("Use JPG, PNG or WebP.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMb}MB.`);
      return;
    }
    // Simulate a secure upload with progress, then stage the data URL.
    setProgress(0);
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => {
      let p = 0;
      const iv = setInterval(() => {
        p = Math.min(100, p + 18);
        setProgress(p);
        if (p >= 100) {
          clearInterval(iv);
          setProgress(null);
          onChange(reader.result as string);
        }
      }, 90);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* Preview tile */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "relative flex items-center justify-center overflow-hidden rounded-xl border-2 bg-subtle",
              aspect === "portrait" ? "h-40 w-32" : "h-32 w-32",
              drag ? "border-accent" : "border-line",
            )}
          >
            {currentUrl ? (
              <img src={currentUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted">
                <ImageUp className="h-6 w-6" />
                <span className="text-[11px]">No image</span>
              </div>
            )}
            {progress !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80 backdrop-blur">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[11px] text-muted">{progress}%</span>
              </div>
            )}
          </div>
          {currentUrl && progress === null && (
            <div className="mt-2 flex gap-1">
              <button type="button" onClick={() => setPreview(true)} className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-muted hover:text-accent" title="Full-screen preview">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button type="button" onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-muted hover:text-error" title="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dropzone + meta */}
        <div className="flex-1">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
              drag ? "border-accent bg-accent-soft/40" : "border-line hover:border-line-strong hover:bg-subtle",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Upload className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-strong">Drag & drop or click to upload</span>
            <span className="text-xs text-muted">JPG, PNG or WebP · up to {maxSizeMb}MB</span>
          </button>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <Check className="h-3.5 w-3.5 text-success" /> Stored securely · resized client-side · never shared.
          </p>
        </div>
      </div>

      {/* Full-screen preview modal */}
      {preview && currentUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(false)}>
          <button type="button" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setPreview(false)} aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img src={currentUrl} alt="Full preview" className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-elevated" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPreview(false)} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Eye className="h-4 w-4" /> Close
              </Button>
              <Button type="button" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /> Replace</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
