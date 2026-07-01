export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[80px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
