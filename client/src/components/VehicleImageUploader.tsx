import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VehicleImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function VehicleImageUploader({ value, onChange, onRemove }: VehicleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione apenas arquivos de imagem", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande. Máximo 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    
    try {
      const compressedFile = await compressImage(file);
      
      const metadataResponse = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: compressedFile.name,
          size: compressedFile.size,
          contentType: compressedFile.type,
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error("Erro ao obter URL de upload");
      }

      const { uploadURL, objectPath } = await metadataResponse.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: compressedFile,
        headers: { "Content-Type": compressedFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const publicUrl = objectPath;
      setPreview(publicUrl);
      onChange(publicUrl);
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: error instanceof Error ? error.message : "Erro ao fazer upload", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [onChange, toast]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange("");
    onRemove?.();
  }, [onChange, onRemove]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      {preview ? (
        <div className="relative rounded-md border overflow-hidden">
          <img
            src={preview}
            alt="Preview do veículo"
            className="w-full h-48 object-cover"
            data-testid="img-vehicle-preview"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={isUploading}
            data-testid="button-remove-image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={isUploading ? undefined : handleClick}
          className={`
            flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-md
            transition-colors cursor-pointer
            ${isUploading ? "opacity-50 cursor-not-allowed" : "hover-elevate"}
          `}
          data-testid="dropzone-vehicle-image"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para enviar imagem</span>
              <span className="text-xs text-muted-foreground">JPG, PNG até 10MB (comprimido automaticamente)</span>
            </>
          )}
        </div>
      )}
      
      {!preview && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full"
          data-testid="button-upload-image"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Imagem
            </>
          )}
        </Button>
      )}
    </div>
  );
}
