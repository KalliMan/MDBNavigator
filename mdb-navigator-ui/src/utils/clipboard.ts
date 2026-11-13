// navigator.clipboard exists only on HTTPS and localhost; the caller tells the user when this fails.
export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('The clipboard is not available');
  }
  await navigator.clipboard.writeText(text);
}
