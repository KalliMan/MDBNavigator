export interface TabProps {
  id: string;
  label: string;
}

export default function Tab({ label, id, children }: React.PropsWithChildren<TabProps>) {
  return (
    <div about={label} key={id} className="hidden">
      {children}
    </div>
  );
}
