
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { Image } from '../../../server/src/schema';

interface ImageGalleryProps {
  images: Image[];
  onImageDelete?: (imageId: number) => void;
  currentUserId?: number;
  showPrivate?: boolean;
}

export function ImageGallery({ images, onImageDelete, currentUserId, showPrivate = false }: ImageGalleryProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (imageId: number, userId: number) => {
    if (!onImageDelete) return;
    
    setDeletingId(imageId);
    try {
      await trpc.deleteImage.mutate({ id: imageId, user_id: userId });
      onImageDelete(imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image: Image) => (
        <Card key={image.id} className="group hover:shadow-lg transition-all duration-200 bg-white border-purple-100">
          <CardContent className="p-0">
            {/* Image */}
            <div className="relative overflow-hidden rounded-t-lg">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                {/* Stub: In real app, this would show the actual image */}
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm px-4">{image.filename}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(image.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {/* Privacy Badge */}
              {showPrivate && (
                <Badge 
                  variant={image.is_public ? "default" : "secondary"}
                  className="absolute top-2 right-2"
                >
                  {image.is_public ? '🌍 Public' : '🔒 Private'}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{image.title}</h3>
                {image.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mt-1">{image.description}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>👁️ {image.view_count} views</span>
                <span>📅 {image.created_at.toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {/* Share Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 border-purple-200 hover:bg-purple-50">
                      🔗 Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>📤 Share "{image.title}"</DialogTitle>
                      <DialogDescription>
                        Copy the link below to share this image
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Short URL</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={`${window.location.origin}/i/${image.short_url}`}
                            readOnly
                            className="bg-gray-50"
                          />
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(`${window.location.origin}/i/${image.short_url}`)}
                          >
                            📋 Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Button (only for owner) */}
                {currentUserId === image.user_id && onImageDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-200 hover:bg-red-50 text-red-600"
                        disabled={deletingId === image.id}
                      >
                        {deletingId === image.id ? '⏳' : '🗑️'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>🗑️ Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{image.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image.id, image.user_id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
