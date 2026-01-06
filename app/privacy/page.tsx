'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-emerald-50 py-12 px-6 sm:px-12">
            <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl sm:p-12">
                <div className="mb-10 flex items-center gap-4">
                    <Link href="/">
                        <Image
                            src="/Logo.png"
                            alt="Juanttendify Logo"
                            width={64}
                            height={64}
                            className="object-contain"
                            unoptimized
                        />
                    </Link>
                    <h1 className="text-3xl font-extrabold text-emerald-900 font-quicksand">Privacy Policy</h1>
                </div>

                <div className="space-y-6 text-emerald-800 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-emerald-700">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us when you register, such as your name, email address, Student LRN (for students), and password. We also collect location data (latitude, longitude, and accuracy) when you scan QR codes for attendance verification.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-emerald-700">2. How We Use Your Information</h2>
                        <p>Your information is used to monitor school attendance, verify that scans are performed within designated premises, and provide attendance reports to school administrators and teachers. Location data is only collected at the moment of scanning and is not used for continuous tracking.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-emerald-700">3. Data Sharing</h2>
                        <p>Attendance records and profile information are shared with authorized personnel at Juan Sumulong Memorial Junior College. We do not sell or share your personal data with third-party advertisers.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-emerald-700">4. Data Security</h2>
                        <p>We implement security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-emerald-700">5. Your Choices</h2>
                        <p>You may update your profile information or request account deletion through the application settings or by contacting the school administration.</p>
                    </section>

                    <div className="mt-12 pt-8 border-t border-emerald-100">
                        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3 font-bold text-white transition-colors hover:bg-emerald-700">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
