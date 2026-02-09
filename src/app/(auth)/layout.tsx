/**
 * Auth Layout
 * Minimal layout for authentication pages (no sidebar)
 * @module app/(auth)/layout
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full overflow-y-auto">
      {children}
    </div>
  );
}
