import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="rf-fade-up py-10">
      <div className="rf-shell">
        <div className="mb-7 flex items-center justify-between">
          <Link href="/" className="font-mono text-lg font-bold">
            Review Flow
          </Link>
          <Link href="/tarifs" className="rf-btn rf-btn-outline">
            Tarifs
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
