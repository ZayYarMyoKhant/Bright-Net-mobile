
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { countries } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.657-11.303-8H6.306C9.656 39.663 16.318 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.244 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);


export default function SignUpPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('95');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const country = countries.find(c => c.code === countryCode);

  const handlePhoneSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const fullPhoneNumber = `${countryCode}${phone}`;
    
    // In a real app, you'd likely use email, but we use phone as an email for demo purposes
    // as Supabase phone auth requires more setup. This is a workaround.
    const email = `${fullPhoneNumber}@example.com`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Success!",
        description: "Your account has been created.",
      });
      router.push('/profile/setup');
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
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

        <form className="space-y-6" onSubmit={handlePhoneSignUp}>
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
                            required
                        />
                    </div>
                    <Input id="phone" type="tel" placeholder="912345678" className="flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} required/>
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
            
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={loading}>
            <GoogleIcon className="mr-2 h-5 w-5" />
            Sign up with Google
        </Button>

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
