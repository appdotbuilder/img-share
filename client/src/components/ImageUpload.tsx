
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { User, Image, UploadImageInput } from '../../../server/src/schema';

interface ImageUploadProps {
  user: User;
  onImageUploaded: (image: Image) => void;
}

export function ImageUpload({ user, onImageUploaded }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: true
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-fill title with filename (without extension)
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setIsLoading(true);
    
    try {
      // Note: This is a stub implementation for file upload
      // In a real app, you'd upload to a file storage service first
      const uploadInput: UploadImageInput = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        filename: selectedFile.name,
        file_path: `/uploads/${user.id}/${Date.now()}_${selectedFile.name}`, // Stub path
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        is_public: formData.is_public
      };
      
      const uploadedImage = await trpc.uploadImage.mutate(uploadInput);
      onImageUploaded(uploadedImage);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        is_public: true
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <div className="space-y-4">
        <Label htmlFor="file-input" className="text-base font-medium">
          📁 Choose Image
        </Label>
        <Input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          required
          className="border-purple-200 focus:border-purple-400"
        />
        
        {/* Preview */}
        {previewUrl && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full h-48 object-contain mx-auto rounded-lg"
              />
              <p className="text-center text-sm text-gray-600 mt-2">
                📏 {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          🏷️ Title
        </Label>
        <Input
          id="title"
          placeholder="Give your image a catchy title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, title: e.target.value }))
          }
          minLength={1}
          maxLength={255}
          required
          className="border-purple-200 focus:border-purple-400"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          📝 Description (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Tell us more about this image..."
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          rows={3}
          className="border-purple-200 focus:border-purple-400 resize-none"
        />
      </div>

      {/* Privacy Setting */}
      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="space-y-1">
          <Label className="text-base font-medium">
            {formData.is_public ? '🌍 Public' : '🔒 Private'}
          </Label>
          <p className="text-sm text-gray-600">
            {formData.is_public 
              ? 'Everyone can see this image in the public gallery'
              : 'Only you can see this image'
            }
          </p>
        </div>
        <Switch
          checked={formData.is_public}
          onCheckedChange={(checked: boolean) =>
            setFormData(prev => ({ ...prev, is_public: checked }))
          }
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-3 text-lg"
        disabled={isLoading || !selectedFile}
      >
        {isLoading ? '🚀 Uploading...' : '✨ Share Image'}
      </Button>
    </form>
  );
}
