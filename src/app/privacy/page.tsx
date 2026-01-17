
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
                        <CardTitle>Privacy Policy for Bright Net Social Network</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                        <p><strong>Last Updated:</strong> January 17, 2026</p>
                        <p>Bright Net ("the App," "we," "us," or "our") is a social networking platform developed and operated in a strategic partnership with ULife Communication. We are dedicated to protecting the privacy of our users while maintaining a safe, ethical, and transparent digital environment.</p>
                        <p>This Privacy Policy outlines how we collect, store, and process your information, as well as the strict code of conduct required to maintain a membership in our community.</p>
                        
                        <h2>1. Information Collection and Usage</h2>
                        <p>To provide a personalized social experience, we collect the following types of information:</p>
                        <ul>
                            <li><strong>Account Information:</strong> When you register, we collect your name, email address, phone number, and profile identifiers.</li>
                            <li><strong>User-Generated Content:</strong> This includes posts, photos, videos, comments, and messages.</li>
                            <li><strong>Technical Data:</strong> We collect IP addresses, device types, operating system versions, and app usage statistics to optimize performance and security.</li>
                            <li><strong>Purpose:</strong> All data is used to provide service functionality, ensure user safety, and improve the features offered by Bright Net and ULife Communication.</li>
                        </ul>

                        <h2>2. Children’s Privacy (Special Protection)</h2>
                        <p>Bright Net recognizes the high importance of protecting the privacy of young children.</p>
                        <ul>
                            <li><strong>Age Restriction:</strong> Our services are not intended for children under the age of 13. We do not knowingly collect personal data from children under 13.</li>
                            <li><strong>Parental Oversight:</strong> For users between the ages of 13 and 18, we strongly recommend parental supervision.</li>
                            <li><strong>Data Deletion:</strong> If we discover that a child under 13 has provided us with personal information without verified parental consent, we will delete that information and terminate the associated account immediately.</li>
                        </ul>

                        <h2>3. User Conduct and Content Integrity</h2>
                        <p>By using Bright Net, you agree to adhere to the following strict guidelines. This platform is built on the foundation of Truth and Morality.</p>
                        <ul>
                            <li><strong>Ethical Usage:</strong> All users must act with integrity and follow moral standards. Using the App for illegal or malicious purposes is strictly prohibited.</li>
                            <li><strong>Prohibited Content:</strong> We have a zero-tolerance policy for:
                                <ul className="list-disc pl-5 mt-2">
                                    <li>Hate Speech & Violence: Content that promotes hatred, discrimination, or physical threats.</li>
                                    <li>Misinformation (Fake News): The intentional distribution of false information that may cause public alarm or harm.</li>
                                    <li>Inappropriate Media: Any images, videos, or texts that are indecent, immoral, or pornographic.</li>
                                </ul>
                            </li>
                            <li><strong>Privacy Rights:</strong> You are strictly forbidden from sharing the private or sensitive information of other individuals without their explicit, prior consent.</li>
                            <li><strong>Intellectual Property:</strong> Users must respect copyright laws. Do not post content (music, art, videos) that you do not own unless you have permission from the rightful owner.</li>
                            <li><strong>Anti-Fraud & Spam:</strong> Users shall not engage in scams, phishing, fraudulent schemes, or the distribution of unsolicited spam.</li>
                        </ul>

                        <h2>4. Community Respect and Administration</h2>
                         <ul>
                            <li><strong>Respectful Interaction:</strong> All members must treat others with dignity. Harassment, cyberbullying, and verbal abuse will not be tolerated.</li>
                            <li><strong>Administrative Authority:</strong> To maintain community safety, Bright Net administrators reserve the absolute right to monitor, review, and remove any content deemed inappropriate without prior notice.</li>
                            <li><strong>Account Sanctions:</strong> Violating any of these policies may result in immediate penalties, including temporary suspension or permanent banning of the account, depending on the severity of the violation.</li>
                        </ul>

                        <h2>5. Data Security and Sharing</h2>
                        <p>We prioritize the security of your data through encryption and industry-standard safety protocols.</p>
                        <ul>
                            <li><strong>Partnership Sharing:</strong> As a co-founded entity, data may be shared between Bright Net and ULife Communication solely for technical operations and service enhancement.</li>
                            <li><strong>No Third-Party Sales:</strong> We do not sell, rent, or trade your personal information to third-party advertisers.</li>
                            <li><strong>Legal Disclosure:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                        </ul>

                        <h2>6. Amendments to the Policy</h2>
                        <p>Bright Net reserves the right to modify, update, or change these Privacy Policies at any time to reflect changes in the law or our services. Users are encouraged to review this page periodically. Continued use of the App after changes are posted constitutes your formal acceptance of the new terms.</p>

                        <h2>7. Contact and Support</h2>
                        <p>If you have questions, concerns, or wish to report a policy violation, please reach out to our administration team:</p>
                         <ul>
                            <li><strong>Co-Founding Partner:</strong> ULife Communication</li>
                            <li><strong>Official Contact Email:</strong> zeyarzeyarmyokhant@gmail.com</li>
                        </ul>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
