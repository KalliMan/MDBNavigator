interface Props {
  id: string;
  label: string;
}

export default function Tab({ label, id, children }: React.PropsWithChildren<Props>) {
  return (
    <div about={label} key={id} className="hidden">
      {children}
    </div>
  );
}
