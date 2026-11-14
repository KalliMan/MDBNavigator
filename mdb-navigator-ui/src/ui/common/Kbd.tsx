// A key or a mouse action named in a hint, e.g. Ctrl+Enter.
export default function Kbd({ children }: React.PropsWithChildren) {
  return <kbd className="rounded-[3px] border border-line bg-surface px-1.5 py-px font-mono text-xs text-fg">{children}</kbd>;
}
