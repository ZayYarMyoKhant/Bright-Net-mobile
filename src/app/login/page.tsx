
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "ဝင်ရောက်မှု မအောင်မြင်ပါ",
        description: error.message,
      });
    } else {
        router.push("/");
        router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="text-center mb-8">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">ပြန်လည်ကြိုဆိုပါတယ်</h1>
                <p className="text-muted-foreground mt-2">Roll Call အသုံးပြုရန် အကောင့်ဝင်ပါ</p>
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 border-slate-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="စကားဝှက် ရိုက်ထည့်ပါ"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 border-slate-200 pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-100" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    အကောင့်ဝင်မည်
                </Button>
            </form>
            
            <div className="mt-8 text-center text-sm">
                <p className="text-slate-500">
                    အကောင့်မရှိသေးဘူးလား?{' '}
                    <Link href="/signup" className="text-blue-600 font-bold hover:underline">
                        အကောင့်သစ်ဖွင့်ရန်
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}
