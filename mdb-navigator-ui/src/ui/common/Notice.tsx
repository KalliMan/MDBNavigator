// A message box: an error, a neutral note or a success.
export default function Notice({ tone, children }: React.PropsWithChildren<{ tone: 'error' | 'info' | 'success' }>) {
  const styles = {
    error: 'border-danger/30 bg-danger-soft text-danger',
    info: 'border-line bg-surface text-fg',
    success: 'border-success/30 bg-success-soft text-success',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-[3px] border px-3 py-2 break-words ${styles[tone]}`}>
      {children}
    </div>
  );
}
