// The frame of every sign-in page: the app's name above a centered card.
export default function AuthLayout({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-1">
        <img src="/icon.svg" alt="" className="h-10 w-10" />
        <h1 className="text-2xl font-semibold text-fg">MDBNavigator</h1>
        <p className="text-sm text-fg-muted">Browse and query your databases</p>
      </div>
      <main className="w-full max-w-sm rounded-lg border border-line bg-canvas p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-fg">{title}</h2>
        <div className="grid gap-4">
          {children}
        </div>
      </main>
    </div>
  );
}
