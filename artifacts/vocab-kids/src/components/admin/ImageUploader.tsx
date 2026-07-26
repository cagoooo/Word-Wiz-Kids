/**
 * ImageUploader — drag-and-drop or camera capture for the admin panel.
 * Shows a camera button on mobile (accept="image/*" capture="environment").
 * All text in Traditional Chinese. No emojis.
 */
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, Camera, Loader2 } from 'lucide-react';

interface Props {
  onImage: (base64: string, mimeType: string, previewUrl: string) => void;
  loading?: boolean;
}

export function ImageUploader({ onImage, loading = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      const previewUrl = dataUrl;
      onImage(base64, file.type, previewUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all select-none ${
          dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/40'
        }`}
        data-testid="drop-zone"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold text-lg">Gemini 辨識中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Upload className="w-10 h-10" />
            <p className="font-bold text-lg">拖曳圖片至此，或點擊上傳</p>
            <p className="text-sm">支援 JPG、PNG、WEBP</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          data-testid="file-input"
        />
      </div>

      {/* Camera button (shows on mobile) */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-muted hover:bg-muted/70 rounded-2xl font-bold text-foreground transition-colors disabled:opacity-50"
        data-testid="camera-btn"
      >
        <Camera className="w-5 h-5" />
        用相機拍攝
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-testid="camera-input"
      />
    </div>
  );
}
