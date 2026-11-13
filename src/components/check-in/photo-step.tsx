"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CameraIcon } from "../icons";
import { Button } from "../ui/button";

type PhotoStepProps = {
  /** The photo as a JPEG data URL, or null when there is none yet */
  photo: string | null;
  /** From the Control Panel: when false the photo can be skipped */
  required: boolean;
  onPhotoChange: (dataUrl: string | null) => void;
  onBack: () => void;
  onNext: () => void;
};

const MAX_SIDE = 720; // pixels on the longest side, so the JPEG stays small (the API accepts up to 1 MB)
const QUALITY = 0.8;

/** Shrinks anything drawable to MAX_SIDE and returns it as a JPEG data URL. */
function toJpeg(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

async function fileToJpeg(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    return toJpeg(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

function cameraMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError") return "Camera access was blocked. Allow the camera in your browser, or upload a photo instead.";
  if (name === "NotFoundError") return "No camera was found on this device. Upload a photo instead.";
  return "Couldn't start the camera. Try again, or upload a photo instead.";
}

export function PhotoStep({ photo, required, onPhotoChange, onBack, onNext }: PhotoStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }

  // switch the camera off when the step is left, so the camera light doesn't stay on
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  // the <video> only exists once `live` is true, so connect the stream after it renders
  useEffect(() => {
    const video = videoRef.current;
    if (live && video && streamRef.current) {
      video.srcObject = streamRef.current;
      void video.play().catch(() => {});
    }
  }, [live]);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("The camera isn't available in this browser (it needs HTTPS or localhost). Upload a photo instead.");
      return;
    }
    setStarting(true);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setLive(true);
    } catch (err) {
      setError(cameraMessage(err));
    } finally {
      setStarting(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    try {
      onPhotoChange(toJpeg(video, video.videoWidth, video.videoHeight));
      stopCamera();
    } catch {
      setError("Couldn't take the photo. Please try again.");
    }
  }

  function retake() {
    onPhotoChange(null);
    void startCamera();
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so choosing the same file again still fires
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    try {
      const jpeg = await fileToJpeg(file);
      stopCamera();
      onPhotoChange(jpeg);
      setError("");
    } catch {
      setError("Couldn't read that image. Try another one.");
    }
  }

  return (
    <div>
      <h3 className="mb-6 text-base font-semibold">Visitor Photo</h3>

      <div className="flex min-h-[260px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-line-strong bg-surface-soft p-4 text-center text-sm text-soft">
        {photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the camera, not a file next/image can optimise */}
            <img src={photo} alt="Visitor" className="h-[240px] w-full max-w-[320px] rounded-xl object-cover" />
            <strong className="font-semibold text-fg">Photo captured</strong>
          </>
        ) : live ? (
          <>
            {/* mirrored like a selfie preview; the saved photo is not mirrored */}
            <video ref={videoRef} muted playsInline className="h-[240px] w-full max-w-[320px] -scale-x-100 rounded-xl bg-black object-cover" />
            <span>Position the visitor in front of the camera</span>
          </>
        ) : (
          <>
            <span className="grid h-[62px] w-[62px] place-items-center rounded-full bg-brand-soft text-brand">
              <CameraIcon size={30} />
            </span>
            <strong className="font-semibold text-fg">Take a visitor photo</strong>
            <span>Open the camera, or upload a photo from this device</span>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onFile} className="hidden" />

      <div className="mt-4 flex flex-wrap justify-center gap-2.5">
        {live ? (
          <>
            <Button onClick={capture}>
              <CameraIcon size={16} /> Capture Photo
            </Button>
            <Button variant="ghost" onClick={stopCamera}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={photo ? retake : startCamera} disabled={starting}>
              <CameraIcon size={16} /> {starting ? "Starting camera…" : photo ? "Retake Photo" : "Open Camera"}
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              Upload a photo
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Back
        </Button>
        <Button onClick={onNext} disabled={(required && !photo) || live}>
          {!photo && !required ? "Skip photo" : "Next: Confirm"} <ArrowRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
