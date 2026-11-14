interface Props {
  icon: React.ReactNode;
  title: string;
}

// What a pane shows while it has nothing: an icon, a line that says so, and under it (children) what to do next.
export default function EmptyState({ icon, title, children }: React.PropsWithChildren<Props>) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 overflow-auto p-6 text-center">
      <div className="text-fg-faint">{icon}</div>
      <div className="font-semibold text-fg">{title}</div>
      {children && <div className="flex flex-col items-center gap-4 text-fg-muted">{children}</div>}
    </div>
  );
}
