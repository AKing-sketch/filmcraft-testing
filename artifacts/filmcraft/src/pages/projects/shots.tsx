import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useProjectId } from "@/context/pod-project";
import {
  useListShots, useCreateShot, useUpdateShot, useDeleteShot,
  getListShotsQueryKey,
} from "@workspace/api-client-react";
import {
  Plus, Video, Trash2, Camera, LayoutGrid, List,
  X, Upload, RotateCcw, Check, Aperture, Film,
  ChevronDown, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

// ── Cinema camera / lens libraries ────────────────────────────────────────────

const CINEMA_CAMERAS = [
  "ARRI Alexa 35",
  "ARRI Alexa Mini LF",
  "ARRI Alexa Mini",
  "ARRI AMIRA",
  "RED V-RAPTOR 8K VV",
  "RED KOMODO-X 6K",
  "RED KOMODO 6K",
  "RED MONSTRO 8K VV",
  "Sony VENICE 2 (8K)",
  "Sony FX9",
  "Sony FX6",
  "Sony FX3",
  "Sony FX30",
  "Canon EOS C70",
  "Canon EOS C300 Mk III",
  "Canon EOS C500 Mk II",
  "Blackmagic URSA Mini Pro 12K",
  "Blackmagic Pocket Cinema 6K G2",
  "Blackmagic Pocket Cinema 4K",
  "Blackmagic Cinema Camera 6K",
  "Panasonic AU-EVA1",
  "Panasonic Lumix S5 II",
  "Nikon Z8",
  "Nikon Z9",
  "Other / Custom",
];

const CINEMA_LENSES = [
  // Ultra-wide
  "14mm",
  "16mm",
  "18mm",
  "21mm",
  "24mm",
  // Standard wide
  "25mm",
  "27mm",
  "28mm",
  "32mm",
  "35mm",
  // Mid-range
  "40mm",
  "50mm",
  "58mm",
  "65mm",
  "75mm",
  // Telephoto
  "85mm",
  "100mm",
  "135mm",
  "150mm",
  "200mm",
  // Long telephoto
  "300mm",
  "400mm",
  // Zoom ranges
  "15-30mm (zoom)",
  "24-70mm (zoom)",
  "70-200mm (zoom)",
  "28-300mm (zoom)",
  // Named cinema glass
  "Zeiss Master Prime",
  "Zeiss Ultra Prime",
  "Cooke S4/i",
  "Cooke S7/i",
  "Leica Summilux-C",
  "Leica Thalia",
  "Sigma Art Cine",
  "Canon K35",
  "Angenieux Optimo",
  "Other / Custom",
];

const SHOT_TYPES = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "AERIAL", "INSERT"];
const CAMERA_MOVEMENTS = ["static", "pan", "tilt", "dolly", "crane", "handheld", "steadicam", "zoom"];

const STATUS_COLORS: Record<string, string> = {
  planned:  "bg-secondary text-secondary-foreground border-border",
  shot:     "bg-primary/20 text-primary border-primary/30",
  approved: "bg-green-500/20 text-green-500 border-green-500/30",
  cut:      "bg-destructive/20 text-destructive border-destructive/30",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resizeDataUrl(dataUrl: string, maxPx = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = dataUrl;
  });
}

// ── Camera Capture Modal ──────────────────────────────────────────────────────

function CameraCaptureModal({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch {
      setError("Camera access denied or unavailable. Try uploading an image instead.");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera, facingMode]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function confirmCapture() {
    if (!preview) return;
    const resized = await resizeDataUrl(preview);
    onCapture(resized);
  }

  function retake() {
    setPreview(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Capture Reference Photo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative bg-black aspect-video">
          {!preview ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={preview} alt="Captured" className="w-full h-full object-cover" />
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="p-4 flex gap-2 justify-center">
          {!preview ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => setFacingMode(m => m === "environment" ? "user" : "environment")}
                title="Flip camera"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Flip
              </Button>
              <Button onClick={capture} disabled={!!error} className="bg-primary text-primary-foreground gap-2">
                <Camera className="w-4 h-4" /> Take Photo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="border-border" onClick={retake}>
                <RotateCcw className="w-4 h-4 mr-1" /> Retake
              </Button>
              <Button onClick={confirmCapture} className="bg-primary text-primary-foreground gap-2">
                <Check className="w-4 h-4" /> Use Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shot Form ─────────────────────────────────────────────────────────────────

type ShotFormData = {
  shotNumber: string;
  description: string;
  shotType: string;
  cameraMovement: string;
  cameraBody: string;
  lens: string;
  status: string;
  notes: string;
  referenceImage: string | null;
};

const EMPTY_FORM: ShotFormData = {
  shotNumber: "", description: "", shotType: "MS",
  cameraMovement: "static", cameraBody: "", lens: "",
  status: "planned", notes: "", referenceImage: null,
};

function ShotFormFields({
  form,
  onChange,
}: {
  form: ShotFormData;
  onChange: (update: Partial<ShotFormData>) => void;
}) {
  const [showCapture, setShowCapture] = useState(false);
  const [customLens, setCustomLens] = useState("");
  const [customCamera, setCustomCamera] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const resized = await resizeDataUrl(dataUrl);
      onChange({ referenceImage: resized });
    };
    reader.readAsDataURL(file);
  }

  const lensValue = CINEMA_LENSES.includes(form.lens) ? form.lens : (form.lens ? "Other / Custom" : "");
  const cameraValue = CINEMA_CAMERAS.includes(form.cameraBody) ? form.cameraBody : (form.cameraBody ? "Other / Custom" : "");

  function handleLensChange(v: string) {
    if (v === "Other / Custom") {
      onChange({ lens: customLens });
    } else {
      onChange({ lens: v });
    }
  }

  function handleCameraChange(v: string) {
    if (v === "Other / Custom") {
      onChange({ cameraBody: customCamera });
    } else {
      onChange({ cameraBody: v });
    }
  }

  return (
    <div className="space-y-4">
      {/* Reference image */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Reference / Storyboard Image</label>
        {form.referenceImage ? (
          <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-black">
            <img src={form.referenceImage} alt="Reference" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ referenceImage: null })}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border gap-2 flex-1"
              onClick={() => setShowCapture(true)}
            >
              <Camera className="w-4 h-4" /> Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border gap-2 flex-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-4 h-4" /> Upload
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )}
      </div>

      {/* Shot # and status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Shot #</label>
          <Input
            value={form.shotNumber}
            onChange={e => onChange({ shotNumber: e.target.value })}
            required
            placeholder="1A"
            className="bg-background border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select value={form.status} onValueChange={v => onChange({ status: v })}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="shot">Shot</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="cut">Cut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={form.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="What's happening in this shot…"
          className="bg-background border-border text-sm"
          rows={2}
        />
      </div>

      {/* Shot type + movement */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Shot Type</label>
          <Select value={form.shotType} onValueChange={v => onChange({ shotType: v })}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {SHOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Camera Movement</label>
          <Select value={form.cameraMovement} onValueChange={v => onChange({ cameraMovement: v })}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {CAMERA_MOVEMENTS.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Camera body */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-muted-foreground" /> Camera Body
        </label>
        <Select value={cameraValue} onValueChange={handleCameraChange}>
          <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select camera…" /></SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            {CINEMA_CAMERAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {(cameraValue === "Other / Custom" || (!CINEMA_CAMERAS.includes(form.cameraBody) && form.cameraBody)) && (
          <Input
            value={form.cameraBody}
            onChange={e => { setCustomCamera(e.target.value); onChange({ cameraBody: e.target.value }); }}
            placeholder="Enter camera model…"
            className="bg-background border-border text-sm"
          />
        )}
      </div>

      {/* Lens */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Aperture className="w-3.5 h-3.5 text-muted-foreground" /> Lens
        </label>
        <Select value={lensValue} onValueChange={handleLensChange}>
          <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select lens…" /></SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            {CINEMA_LENSES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        {(lensValue === "Other / Custom" || (!CINEMA_LENSES.includes(form.lens) && form.lens)) && (
          <Input
            value={form.lens}
            onChange={e => { setCustomLens(e.target.value); onChange({ lens: e.target.value }); }}
            placeholder="Enter focal length or lens name…"
            className="bg-background border-border text-sm"
          />
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={form.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Additional notes…"
          className="bg-background border-border text-sm"
          rows={2}
        />
      </div>

      {showCapture && (
        <CameraCaptureModal
          onCapture={(dataUrl) => { onChange({ referenceImage: dataUrl }); setShowCapture(false); }}
          onClose={() => setShowCapture(false)}
        />
      )}
    </div>
  );
}

// ── Shot Board Card ───────────────────────────────────────────────────────────

function ShotBoardCard({
  shot,
  onDelete,
  onUpdate,
}: {
  shot: ReturnType<typeof useListShots>["data"] extends (infer T)[] | undefined ? T : never;
  onDelete: () => void;
  onUpdate: (data: Partial<ShotFormData>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ShotFormData>({
    shotNumber: shot.shotNumber,
    description: shot.description ?? "",
    shotType: shot.shotType ?? "MS",
    cameraMovement: shot.cameraMovement ?? "static",
    cameraBody: shot.cameraBody ?? "",
    lens: shot.lens ?? "",
    status: shot.status ?? "planned",
    notes: shot.notes ?? "",
    referenceImage: shot.referenceImage ?? null,
  });

  function handleSave() {
    onUpdate(form);
    setEditing(false);
  }

  return (
    <>
      <div
        className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/40 transition-colors cursor-pointer group"
        onClick={() => setEditing(true)}
      >
        {/* Image area */}
        <div className="relative aspect-video bg-zinc-900 flex-shrink-0">
          {shot.referenceImage ? (
            <img src={shot.referenceImage} alt={`Shot ${shot.shotNumber}`} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">No image — click to add</span>
            </div>
          )}
          {/* Status badge */}
          <span className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${STATUS_COLORS[shot.status || "planned"]}`}>
            {shot.status}
          </span>
          {/* Shot number */}
          <div className="absolute top-2 left-2 bg-black/70 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
            {shot.shotNumber}
          </div>
          {/* Camera icon overlay on hover */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white/80" />
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          {shot.description && (
            <p className="text-sm text-foreground font-medium line-clamp-2 leading-snug">{shot.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {shot.shotType && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                {shot.shotType}
              </span>
            )}
            {shot.cameraMovement && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border capitalize">
                {shot.cameraMovement}
              </span>
            )}
            {shot.lens && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border flex items-center gap-1">
                <Aperture className="w-2.5 h-2.5" />{shot.lens}
              </span>
            )}
          </div>
          {shot.cameraBody && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <Film className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{shot.cameraBody}</span>
            </p>
          )}
        </div>

        {/* Delete */}
        <div className="px-3 pb-3 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive hover:text-destructive/70 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold">Edit Shot {shot.shotNumber}</h2>
              <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <ShotFormFields form={form} onChange={(u) => setForm(f => ({ ...f, ...u }))} />
            </div>
            <div className="px-4 pb-4 flex gap-2 justify-end sticky bottom-0 bg-card pt-3 border-t border-border">
              <Button variant="outline" className="border-border" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShotList() {
  const projectId = useProjectId();
  const queryClient = useQueryClient();

  const { data: shots, isLoading } = useListShots(projectId, { query: { enabled: !!projectId } });
  const createShot = useCreateShot();
  const updateShot = useUpdateShot();
  const deleteShot = useDeleteShot();

  const [view, setView] = useState<"list" | "board">("list");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<ShotFormData>(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListShotsQueryKey(projectId) });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shotNumber.trim()) return;
    createShot.mutate(
      { projectId, data: { ...form, referenceImage: form.referenceImage ?? null } },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setForm(EMPTY_FORM);
          invalidate();
        },
      }
    );
  };

  const handleDelete = (shotId: number) => {
    if (confirm("Delete this shot?")) {
      deleteShot.mutate({ projectId, id: shotId }, { onSuccess: invalidate });
    }
  };

  const handleUpdate = (shotId: number, data: Partial<ShotFormData>) => {
    updateShot.mutate({ projectId, id: shotId, data }, { onSuccess: invalidate });
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const hasImages = shots?.some(s => s.referenceImage);

  return (
    <div className="p-4 md:p-8 max-w-7xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shot List</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Plan and track your camera setups. Add reference photos from your device camera.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView("board")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                view === "board" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
              {hasImages && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Add button */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" /> Add Shot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Shot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <ShotFormFields form={form} onChange={(u) => setForm(f => ({ ...f, ...u }))} />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!form.shotNumber.trim() || createShot.isPending}
                >
                  {createShot.isPending ? "Saving…" : "Save Shot"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Board View ────────────────────────────────────────────────── */}
      {view === "board" && (
        <>
          {shots?.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-16 text-center text-muted-foreground space-y-2">
              <Video className="w-10 h-10 mx-auto opacity-20" />
              <p className="font-medium">No shots yet</p>
              <p className="text-sm">Add your first shot above and capture a reference photo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {shots?.map(shot => (
                <ShotBoardCard
                  key={shot.id}
                  shot={shot}
                  onDelete={() => handleDelete(shot.id)}
                  onUpdate={(data) => handleUpdate(shot.id, data)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── List View ─────────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="border border-border rounded-xl bg-card overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-16">Shot</th>
                <th className="px-4 py-3 font-medium w-12">Img</th>
                <th className="px-4 py-3 font-medium w-20">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium w-28 hidden md:table-cell">Movement</th>
                <th className="px-4 py-3 font-medium w-36 hidden lg:table-cell">Camera</th>
                <th className="px-4 py-3 font-medium w-28 hidden md:table-cell">Lens</th>
                <th className="px-4 py-3 font-medium w-24">Status</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shots?.map(shot => (
                <tr
                  key={shot.id}
                  className="hover:bg-accent/30 group cursor-pointer"
                  onClick={() => {
                    // Switch to board and open edit
                    setView("board");
                  }}
                >
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{shot.shotNumber}</td>
                  <td className="px-4 py-3">
                    {shot.referenceImage ? (
                      <img
                        src={shot.referenceImage}
                        alt=""
                        className="w-10 h-7 object-cover rounded border border-border"
                      />
                    ) : (
                      <div className="w-10 h-7 rounded border border-dashed border-border flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-muted-foreground/30" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {shot.shotType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{shot.description}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize hidden md:table-cell">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      {shot.cameraMovement}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-xs truncate max-w-[140px]">
                      <Film className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{shot.cameraBody || "—"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    <span className="flex items-center gap-1 text-xs">
                      <Aperture className="w-3 h-3" />
                      {shot.lens || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[shot.status || "planned"]}`}>
                      {shot.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(shot.id); }}
                      className="text-destructive hover:text-destructive/70 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {shots?.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No shots planned yet. Create your first shot setup.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
