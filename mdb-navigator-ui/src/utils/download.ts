// Saves text as a file through a temporary link, entirely in the browser.
export function downloadText(fileName: string, text: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked a little later: some browsers start the download only after this function has returned.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
