
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { countries, Country } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area";


export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [countryCode, setCountryCode] = useState("+95");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCountry = countries.find(c => `+${c.code}` === countryCode);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    const { data, error } = await supabase.auth.signUp({
      phone: fullPhoneNumber,
      password: password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } else if (data.user) {
       toast({
        title: "Account created!",
        description: "Please check your phone for a verification message.",
      });
      // In a real phone auth flow, you'd go to an OTP page.
      // For this prototype, we'll assume auto-verification and go to profile setup.
      router.push("/profile/setup");
    }
    setLoading(false);
  };


  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Let Bright with <span className="text-primary">Bright-Net</span></h1>
                <p className="text-muted-foreground mt-2">Account creation</p>
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <span>{selectedCountry?.flag}</span>
                                        <span>{countryCode}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <ScrollArea className="h-64">
                                {countries.map((country) => (
                                    <SelectItem key={country.name} value={`+${country.code}`}>
                                        <div className="flex items-center gap-2">
                                            <span>{country.flag}</span>
                                            <span>{country.name} (+{country.code})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="123456789"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
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
                    Create account
                </Button>
            </form>
        </div>
    </div>
  );
}
