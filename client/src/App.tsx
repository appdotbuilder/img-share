
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageGallery } from '@/components/ImageGallery';
import { UserLogin } from '@/components/UserLogin';
import type { Image, User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [publicImages, setPublicImages] = useState<Image[]>([]);
  const [userImages, setUserImages] = useState<Image[]>([]);

  const loadPublicImages = useCallback(async () => {
    try {
      const images = await trpc.getPublicImages.query();
      setPublicImages(images);
    } catch (error) {
      console.error('Failed to load public images:', error);
    }
  }, []);

  const loadUserImages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const images = await trpc.getUserImages.query({ user_id: currentUser.id });
      setUserImages(images);
    } catch (error) {
      console.error('Failed to load user images:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadPublicImages();
  }, [loadPublicImages]);

  useEffect(() => {
    if (currentUser) {
      loadUserImages();
    }
  }, [loadUserImages, currentUser]);

  const handleImageUpload = async (uploadedImage: Image) => {
    // Add to user images if user is logged in
    if (currentUser && uploadedImage.user_id === currentUser.id) {
      setUserImages(prev => [uploadedImage, ...prev]);
    }
    
    // Add to public images if it's public
    if (uploadedImage.is_public) {
      setPublicImages(prev => [uploadedImage, ...prev]);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    // Remove from both lists
    setUserImages(prev => prev.filter(img => img.id !== imageId));
    setPublicImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📸</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ImageShare
              </h1>
              <p className="text-gray-600 text-sm">Share your moments with the world ✨</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-gray-800">👋 {currentUser.username}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentUser(null)}
                  className="border-purple-200 hover:bg-purple-50"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <UserLogin onLogin={setCurrentUser} />
            )}
          </div>
        </div>

        <Tabs defaultValue="gallery" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="gallery" className="data-[state=active]:bg-purple-100">
              🌍 Public Gallery
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={!currentUser} className="data-[state=active]:bg-purple-100">
              📤 Upload
            </TabsTrigger>
            <TabsTrigger value="my-images" disabled={!currentUser} className="data-[state=active]:bg-purple-100">
              🖼️ My Images
            </TabsTrigger>
          </TabsList>

          {/* Public Gallery */}
          <TabsContent value="gallery" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      🌟 Public Gallery
                    </CardTitle>
                    <CardDescription>
                      Discover amazing images shared by our community
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {publicImages.length} images
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ImageGallery 
                  images={publicImages} 
                  onImageDelete={currentUser ? handleImageDelete : undefined}
                  currentUserId={currentUser?.id}
                />
                {publicImages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🎨</div>
                    <p>No public images yet. Be the first to share something amazing!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload */}
          <TabsContent value="upload" className="space-y-4">
            {currentUser ? (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ✨ Share Your Moment
                  </CardTitle>
                  <CardDescription>
                    Upload an image and get a shareable link instantly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload user={currentUser} onImageUploaded={handleImageUpload} />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-4">🔒</div>
                  <p className="text-gray-600 mb-4">Please log in to upload images</p>
                  <UserLogin onLogin={setCurrentUser} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Images */}
          <TabsContent value="my-images" className="space-y-4">
            {currentUser ? (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        📱 Your Collection
                      </CardTitle>
                      <CardDescription>
                        Manage all your uploaded images
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {userImages.length} images
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ImageGallery 
                    images={userImages} 
                    onImageDelete={handleImageDelete}
                    currentUserId={currentUser.id}
                    showPrivate={true}
                  />
                  {userImages.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">📷</div>
                      <p>You haven't uploaded any images yet. Start sharing your moments!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-purple-100">
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-4">🔒</div>
                  <p className="text-gray-600">Please log in to view your images</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
