
"use client";

import { useState, useMemo, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { countries } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { MultiAccountContext } from "@/hooks/use-multi-account";


export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const multiAccount = useContext(MultiAccountContext);

  const [countryCode, setCountryCode] = useState("95");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCountry = useMemo(() => {
    return countries.find(c => c.code === countryCode);
  }, [countryCode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

    const { data, error } = await supabase.auth.signInWithPassword({
      phone: fullPhoneNumber,
      password: password,
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } else if (data.session && multiAccount) {
        await multiAccount.addOrSwitchAccount(data.session);
        toast({
          title: "Signed In Successfully!",
          description: "Welcome back!",
        });
        router.push("/home");
        router.refresh();
    }
    setLoading(false);
  };


  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground mt-2">Sign in to continue to <span className="text-primary font-semibold">Bright-Net</span></p>
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="flex items-center mt-1 h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <div className="flex items-center h-full pl-3 pr-2 border-r">
                           <span className="text-muted-foreground text-base">+</span>
                            <Input
                                type="tel"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))}
                                className="w-10 border-0 bg-transparent p-0 text-base h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                                required
                                maxLength={4}
                            />
                            <span className="text-xl ml-1">
                               {selectedCountry?.flag || '🌍'}
                           </span>
                        </div>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="123456789"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            required
                            className="border-0 bg-transparent h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-primary font-semibold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}
