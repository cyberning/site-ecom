"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export interface ProductImage {
  id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ImageUploaderProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError("");
      setUploading(true);

      const newImages: ProductImage[] = [];

      for (const file of Array.from(files)) {
        if (images.length + newImages.length >= maxImages) {
          setError(`Maximum ${maxImages} images autorisées`);
          break;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Erreur upload");
            continue;
          }

          newImages.push({
            url: data.url,
            alt: file.name.replace(/\.[^.]+$/, ""),
            isPrimary: images.length + newImages.length === 0,
            sortOrder: images.length + newImages.length,
          });
        } catch {
          setError("Erreur réseau lors de l'upload");
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
      setUploading(false);
    },
    [images, maxImages, onImagesChange]
  );

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // Si l'image supprimée était principale, désigner la première comme principale
    if (images[index]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i, id: img.id })));
  };

  const setPrimary = (index: number) => {
    onImagesChange(
      images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const updateAlt = (index: number, alt: string) => {
    onImagesChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed p-8 text-center transition-[var(--transition)] ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-[var(--text-muted)]">Upload en cours...</span>
          </div>
        ) : (
          <>
            <span className="text-3xl text-[var(--text-muted)]">📷</span>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Glissez-déposez ou cliquez pour ajouter des images
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              JPG, PNG, WebP, GIF — max 5 MB — max {maxImages} images
            </p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="mt-3 cursor-pointer">
              <Button type="button" variant="secondary" size="sm">
                Sélectionner des fichiers
              </Button>
            </label>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Image list */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.url + index}
              className={`group relative overflow-hidden rounded-[var(--radius-md)] border-2 transition-[var(--transition)] ${
                img.isPrimary ? "border-[var(--accent)]" : "border-[var(--border)]"
              }`}
            >
              <div className="aspect-square bg-[var(--bg-secondary)]">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Overlay actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 transition-[var(--transition)] group-hover:bg-black/40">
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  title="Image principale"
                  aria-label={img.isPrimary ? "Image principale" : "Définir comme image principale"}
                  className={`rounded-full p-1 text-xs transition-all duration-300 ${
                    img.isPrimary
                      ? "bg-[var(--accent)] text-white"
                      : "bg-white/80 text-black hover:bg-[var(--accent)] hover:text-white"
                  }`}
                >
                  ⭐
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Supprimer"
                  aria-label={`Supprimer l'image ${index + 1}`}
                  className="rounded-full bg-white/80 p-1 text-xs text-red-500 hover:bg-red-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {img.isPrimary && (
                <span className="absolute top-1 left-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-white">
                  Principale
                </span>
              )}

              {/* Alt text input */}
              <input
                type="text"
                value={img.alt}
                onChange={(e) => updateAlt(index, e.target.value)}
                placeholder="Texte alternatif"
                aria-label={`Texte alternatif pour l'image ${index + 1}`}
                className="w-full border-t border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
