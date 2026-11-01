export interface TabProps {
  id: string;
  label: string;
  // Second line under the label (query tabs: "server · database").
  sublabel?: string;
  // A 3px strip on top of the tab (query tabs: the server's color).
  color?: string;
  // Tooltip.
  title?: string;
}

export default function Tab({ label, id, children }: React.PropsWithChildren<TabProps>) {
  return (
    <div about={label} key={id} className="hidden">
      {children}
    </div>
  );
}
