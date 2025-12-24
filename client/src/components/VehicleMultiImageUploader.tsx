import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { VehicleImage } from "@shared/schema";

interface VehicleMultiImageUploaderProps {
  vehicleId?: number;
  images: VehicleImage[];
  onImageAdd: (imageUrl: string, isPrimary: boolean) => void;
  onImageRemove: (imageId: number) => void;
  onSetPrimary: (imageId: number) => void;
  isLoading?: boolean;
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

export function VehicleMultiImageUploader({ 
  vehicleId, 
  images, 
  onImageAdd, 
  onImageRemove, 
  onSetPrimary,
  isLoading 
}: VehicleMultiImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.order || 0) - (b.order || 0);
  });

  const primaryImage = sortedImages.find(img => img.isPrimary);
  const galleryImages = sortedImages.filter(img => !img.isPrimary);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) {
          toast({ title: "Selecione apenas arquivos de imagem", variant: "destructive" });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `${file.name}: Arquivo muito grande. Máximo 10MB`, variant: "destructive" });
          continue;
        }

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

        const isPrimary = images.length === 0 && i === 0;
        onImageAdd(objectPath, isPrimary);
      }
      
      toast({ title: "Imagens enviadas com sucesso!" });
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
  }, [images.length, onImageAdd, toast]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload-multi"
      />

      {primaryImage && (
        <div className="space-y-2">
          <span className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Imagem Principal
          </span>
          <div className="relative rounded-md border overflow-hidden">
            <img
              src={primaryImage.imageUrl}
              alt="Imagem principal do veículo"
              className="w-full h-56 object-cover"
              data-testid="img-vehicle-primary"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => onImageRemove(primaryImage.id)}
              disabled={isUploading}
              data-testid="button-remove-primary-image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Galeria de Imagens</span>
          <div className="grid grid-cols-3 gap-3">
            {galleryImages.map((image, index) => (
              <div 
                key={image.id} 
                className="relative rounded-md border overflow-hidden group"
              >
                <img
                  src={image.imageUrl}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-24 object-cover"
                  data-testid={`img-vehicle-gallery-${image.id}`}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => onSetPrimary(image.id)}
                    disabled={isUploading}
                    data-testid={`button-set-primary-${image.id}`}
                    title="Definir como principal"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => onImageRemove(image.id)}
                    disabled={isUploading}
                    data-testid={`button-remove-gallery-${image.id}`}
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        onClick={isUploading ? undefined : handleClick}
        className={`
          flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-md
          transition-colors cursor-pointer
          ${isUploading ? "opacity-50 cursor-not-allowed" : "hover-elevate"}
        `}
        data-testid="dropzone-vehicle-images"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Enviando...</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Clique para adicionar imagens
            </span>
            <span className="text-xs text-muted-foreground">
              {images.length === 0 
                ? "A primeira imagem será a principal" 
                : "Selecione múltiplas imagens de uma vez"}
            </span>
          </>
        )}
      </div>
      
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full"
        data-testid="button-upload-images"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Adicionar Imagens
          </>
        )}
      </Button>
    </div>
  );
}
