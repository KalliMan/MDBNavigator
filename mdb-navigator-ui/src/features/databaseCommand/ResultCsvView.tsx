import Editor from "@monaco-editor/react";
import useTheme from "../../contexts/theme/useTheme";
import { MONO_FONT } from "../../utils/fonts";
import { MONACO_THEMES } from "./monacoSetup";

interface Props {
  text: string;
}

// A result as CSV text, in a read-only Monaco editor (already bundled): it handles 100,000 lines and gives
// selection, Ctrl+A, Ctrl+C and find without new code. The plaintext language is part of the editor core.
export default function ResultCsvView({ text }: Props) {
  const { theme } = useTheme();

  return (
    <Editor
      language="plaintext"
      value={text}
      theme={theme === 'dark' ? MONACO_THEMES.dark : MONACO_THEMES.light}
      options={{
        readOnly: true,
        domReadOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 20,
        fontFamily: MONO_FONT,
        wordWrap: "off",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'none',
        padding: { top: 6 },
      }}
    />
  );
}
