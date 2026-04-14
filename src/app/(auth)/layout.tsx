import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="rf-fade-up min-h-screen py-6">
      <div className="rf-shell flex min-h-[calc(100vh-3rem)] flex-col">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-mono text-lg font-bold">
            ReviewFlow
          </Link>
          <Link href="/tarifs" className="rf-btn rf-btn-outline">
            Tarifs
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </div>
    </main>
  );
}
