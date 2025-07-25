
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput } from '../../../server/src/schema';

interface UserLoginProps {
  onLogin: (user: User) => void;
}

export function UserLogin({ onLogin }: UserLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Note: This is a simplified login - creates user if doesn't exist
      // In real app, you'd have separate login/register flows
      const user = await trpc.createUser.mutate(formData);
      onLogin(user);
      
      // Reset form
      setFormData({
        username: '',
        email: ''
      });
    } catch (error) {
      console.error('Failed to login/create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-purple-100">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">🚀 Get Started</CardTitle>
        <CardDescription>
          Create an account or login to start sharing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
              }
              minLength={3}
              maxLength={50}
              required
              className="border-purple-200 focus:border-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
              }
              required
              className="border-purple-200 focus:border-purple-400"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
            disabled={isLoading}
          >
            {isLoading ? '✨ Creating...' : '🎉 Start Sharing'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
