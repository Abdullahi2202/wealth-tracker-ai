
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Upload } from "lucide-react";

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl?: string;
  userName: string;
  onImageUpdate: (imageUrl: string) => void;
}

export default function ProfileImageUpload({ userId, currentImageUrl, userName, onImageUpdate }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // For now, we'll create a data URL for the image
      // In a real app, you would upload to Supabase Storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        
        // Update the profiles table with the image URL
        const { error } = await supabase
          .from("profiles")
          .update({ 
            image_url: dataUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId);

        if (error) {
          console.error("Error updating profile image:", error);
          toast.error("Failed to update profile image");
          return;
        }

        setImageUrl(dataUrl);
        onImageUpdate(dataUrl);
        toast.success("Profile image updated successfully");
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Profile Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={imageUrl} alt={userName} />
          <AvatarFallback className="text-lg">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <Button
          variant="outline"
          onClick={handleFileSelect}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Change Photo"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <p className="text-sm text-muted-foreground text-center">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </CardContent>
    </Card>
  );
}
