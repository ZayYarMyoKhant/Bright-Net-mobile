
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { countries } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('95');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const country = countries.find(c => c.code === countryCode);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const fullPhoneNumber = `+${countryCode}${phone}`;
    const { data, error } = await supabase.auth.signUp({
        phone: fullPhoneNumber,
        password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
      setLoading(false);
    } else if (data.user) {
      toast({
        title: "Success!",
        description: "Your account has been created. Let's set up your profile.",
      });
      // Redirect to profile setup. The new session will be picked up.
      router.push('/profile/setup');
      router.refresh();
    } else {
        toast({
            variant: "destructive",
            title: "Sign up failed",
            description: "An unexpected error occurred. Please try again.",
        });
        setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };


  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-muted-foreground">Let's get started</p>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Sign up with Google
        </Button>
        
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>

        <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2">
                    <div className="relative w-24">
                        <div className="absolute top-[-1.2rem] right-1 text-2xl">{country ? country.flag : <Globe className="h-5 w-5 text-muted-foreground" />}</div>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+</div>
                        <Input 
                            id="country-code" 
                            type="tel" 
                            placeholder="95" 
                            className="pl-7"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                        />
                    </div>
                    <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="912345678" 
                        className="flex-1" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input 
                        id="password" 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            
            <Button className="w-full" type="submit" disabled={loading || !phone || !password}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
            </Link>
        </p>
      </div>
    </div>
  );
}
