// What a run sent, and where that text started in the editor: 1-based, as Monaco counts (1 and 1 for the whole
// editor, the selection's start for Explain on a selection). A failed run's errorOffset is an index into text.
export interface RunSource {
  text: string;
  line: number;
  column: number;
}
