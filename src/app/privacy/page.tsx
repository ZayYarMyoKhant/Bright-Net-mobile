
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
    const router = useRouter();

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Privacy Policy for Bright-Net</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Privacy Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        <p>Welcome to Bright-Net, a social networking platform founded by ZayYarMyoKhant. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "App"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>

                        <h2>1. INFORMATION WE COLLECT</h2>
                        <p>We may collect information about you in a variety of ways. The information we may collect via the App depends on the content and materials you use, and includes:</p>
                        <ul>
                            <li><strong>Personal Data:</strong> Personally identifiable information, such as your full name, username, phone number, and profile picture that you voluntarily give to us when you register with the App or when you choose to participate in various activities related to the App, such as chat and posting content.</li>
                            <li><strong>User-Generated Content:</strong> We collect the content you create on the App, including photos, videos, captions, comments, direct messages, and information in your user profile (like your bio).</li>
                            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the App, such as your interactions with the service, including following users, liking posts, and usage data.</li>
                             <li><strong>Presence Information:</strong> We collect information about your online status and last seen activity to share with other users, as governed by your privacy settings.</li>
                            <li><strong>Data from Third-Party Services:</strong> We may use third-party advertising companies, such as Adsterra, to serve ads when you visit the App. These companies may use information about your visits to the App and other websites that are contained in web cookies in order to provide advertisements about goods and services of interest to you.</li>
                        </ul>

                        <h2>2. HOW WE USE YOUR INFORMATION</h2>
                        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the App to:</p>
                        <ul>
                            <li>Create and manage your account.</li>
                            <li>Enable user-to-user communications (e.g., chat, comments).</li>
                            <li>Display your profile and posts to other users.</li>
                            <li>Personalize and improve your experience.</li>
                            <li>Monitor and analyze usage and trends to improve the App's functionality.</li>
                            <li>Provide and deliver the products and services you request, process transactions, and send you related information.</li>
                            <li>Serve relevant advertisements to you.</li>
                        </ul>

                        <h2>3. DISCLOSURE OF YOUR INFORMATION</h2>
                        <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                        <ul>
                            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                            <li><strong>Publicly-Visible Information:</strong> Your username, profile photo, and bio are visible to all users of the App. Your posts and comments are also public.</li>
                            <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, hosting services (like Supabase), and advertising.</li>
                        </ul>

                        <h2>4. DATA SECURITY</h2>
                        <p>We use administrative, technical, and physical security measures to help protect your personal information. We utilize Supabase as our backend provider, which employs industry-standard security practices. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

                        <h2>5. DATA RETENTION</h2>
                        <p>We will retain your personal information for as long as your account is active or as needed to provide you services, comply with our legal obligations, resolve disputes, and enforce our agreements. You can delete your account or certain content through the App's interface.</p>

                        <h2>6. POLICY FOR CHILDREN</h2>
                        <p>We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.</p>
                        
                        <h2>7. CHANGES TO THIS PRIVACY POLICY</h2>
                        <p>We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by updating the "Last Updated" date of this Privacy Policy.</p>

                        <h2>8. CONTACT US</h2>
                        <p>If you have questions or comments about this Privacy Policy, please contact us at: zeyarzeyarmyokhant@gmail.com</p>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
