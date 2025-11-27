
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfUsePage() {
    const router = useRouter();

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Terms of Use for Bright-Net</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Terms of Use</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        <p>Welcome to Bright-Net! These terms and conditions outline the rules and regulations for the use of Bright-Net's Application.</p>

                        <p>By accessing this app, we assume you accept these terms and conditions. Do not continue to use Bright-Net if you do not agree to all of the terms and conditions stated on this page.</p>

                        <h2>1. Accounts</h2>
                        <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                        <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

                        <h2>2. User-Generated Content</h2>
                        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.</p>
                        <p>You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third-party posts on or through the Service.</p>
                        <p>You may not post content that is illegal, obscene, defamatory, threatening, infringing of intellectual property rights, invasive of privacy or otherwise injurious to third parties.</p>

                        <h2>3. Prohibited Uses</h2>
                        <p>You agree not to use the Service:</p>
                        <ul>
                            <li>In any way that violates any applicable national or international law or regulation.</li>
                            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
                            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                            <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                        </ul>

                        <h2>4. Intellectual Property</h2>
                        <p>The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Bright-Net and its licensors. The Service is protected by copyright, trademark, and other laws of both the Myanmar and foreign countries.</p>

                        <h2>5. Links To Other Web Sites</h2>
                        <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by Bright-Net.</p>
                        <p>Bright-Net has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.</p>

                        <h2>6. Termination</h2>
                        <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

                        <h2>7. Governing Law</h2>
                        <p>These Terms shall be governed and construed in accordance with the laws of Myanmar, without regard to its conflict of law provisions.</p>
                        
                        <h2>8. Changes To Service</h2>
                        <p>We reserve the right to withdraw or amend our Service, and any service or material we provide via the Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Service is unavailable at any time or for any period.</p>
                        
                        <h2>9. Contact Us</h2>
                        <p>If you have any questions about these Terms, please contact us at: zeyarzeyarmyokhant@gmail.com</p>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
