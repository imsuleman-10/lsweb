"use client";

import { useState, useRef } from "react";
import { uploadAvatar } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

export function AvatarUpload({ currentUrl, initials, color }: { currentUrl?: string; initials: string; color: string }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to < 200KB
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Start with high quality
          let quality = 0.9;
          
          const compress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error("Compression failed"));
                
                // If still > 200KB and quality > 0.1, compress more
                if (blob.size > 200 * 1024 && quality > 0.1) {
                  quality -= 0.1;
                  compress();
                } else {
                  // Found acceptable size or hit quality floor
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              "image/jpeg",
              quality
            );
          };
          
          compress();
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("avatar", compressedFile);
      
      await uploadAvatar(formData);
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => !loading && fileInputRef.current?.click()}>
      <Avatar className="h-24 w-24 border-2 transition-opacity group-hover:opacity-80" style={{ borderColor: `${color}50` }}>
        {currentUrl ? (
          <AvatarImage src={currentUrl} alt="Profile" className="object-cover" />
        ) : null}
        <AvatarFallback className="text-2xl font-bold" style={{ background: `${color}15`, color }}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        {loading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
}
