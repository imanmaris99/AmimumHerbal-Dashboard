import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'motion/react';
import { KeyRound, Mail, LayoutDashboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock login logic - in real app, call POST /admin/login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let role: 'owner' | 'admin' = 'admin';
      let name = 'Staff Admin';
      
      if (email.includes('owner')) {
        role = 'owner';
        name = 'Main Owner';
      }

      setAuth(
        { id: '1', name, email, role, isActive: true },
        'dummy-jwt-token'
      );
      
      toast.success(`Welcome back, ${name}!`);
      navigate('/overview');
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 selection:bg-orange-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
               <LayoutDashboard className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AmImUm</h1>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2 pt-8">
            <CardTitle className="text-2xl font-bold text-center">Admin Gatekeeper</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs font-semibold text-orange-500 hover:text-orange-600">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
            <p className="text-xs text-center text-gray-400 px-8">
              Tip: Use email containing "owner" to test owner-only features.
            </p>
          </CardFooter>
        </Card>
        
        <p className="text-center mt-8 text-sm text-gray-400">
          &copy; 2026 AmImUm System. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
