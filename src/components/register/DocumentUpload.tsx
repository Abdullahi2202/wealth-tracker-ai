
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";

type DocumentType = "passport" | "license";

interface DocumentUploadProps {
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export default function DocumentUpload({ 
  documentType, 
  onDocumentTypeChange, 
  onFileSelect, 
  selectedFile 
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error("Please upload a valid image file (JPEG, JPG, or PNG)");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      onFileSelect(file);
      toast.success("Document uploaded successfully");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="documentType">Identity Document Type</Label>
        <Select value={documentType} onValueChange={onDocumentTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Passport
              </div>
            </SelectItem>
            <SelectItem value="license">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Driver's License
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="documentUpload">
          Upload {documentType === "passport" ? "Passport" : "Driver's License"} Photo
        </Label>
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center">
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-green-600" />
                  <p className="text-sm font-medium text-green-600">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button variant="outline" size="sm" onClick={handleUploadClick}>
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <Button variant="outline" onClick={handleUploadClick}>
                      Choose File
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a clear photo of your {documentType === "passport" ? "passport" : "driver's license"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Supported formats: JPEG, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
