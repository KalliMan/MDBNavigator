namespace MDBNavigator.Providers.PostgreSQL
{
    // One statement of a script.
    // Text: as written, from its first character to just before its ending semicolon, trimmed. Comments stay in.
    // Line: 1-based line, in the script, of its first character that is neither white space nor comment.
    // LeadingWords: its first four bare words, upper-cased (fewer when it has fewer).
    // HasDataChangingWord: INSERT, UPDATE, DELETE or MERGE appears in it as a bare word.
    public sealed record ScriptStatement(string Text, int Line, IReadOnlyList<string> LeadingWords, bool HasDataChangingWord);

    // Splits a script into its statements at the semicolons, so the provider can run them one by one: one
    // statement per round trip lets each result set have its own row limit, lets a stopped result leave the
    // rest of the script alone, and lets an error name the statement that failed.
    // The rules follow psql's own scanner (psqlscan.l): a semicolon inside a string, a quoted identifier,
    // dollar-quoted text, a comment, parentheses or a BEGIN ATOMIC ... END function body does not split.
    public static class PostgresScriptSplitter
    {
        private const int LeadingWordCount = 4;

        public static IReadOnlyList<ScriptStatement> Split(string script)
        {
            var statements = new List<ScriptStatement>();
            var length = script.Length;
            var line = 1;
            var i = 0;

            // State of the statement being read.
            var textStart = -1;          // first non-white-space character after the previous split (comments count)
            var firstLine = 0;           // line of the first significant character; 0 = none yet
            var parenDepth = 0;
            var beginDepth = 0;
            var leadingWords = new List<string>(LeadingWordCount);
            var hasDataChangingWord = false;

            // Called for everything that is part of a statement (not white space, not a comment).
            void MarkSignificant()
            {
                if (firstLine == 0)
                {
                    firstLine = line;
                }
            }

            void StartText()
            {
                if (textStart < 0)
                {
                    textStart = i;
                }
            }

            void EndStatement(int end)
            {
                if (firstLine != 0)
                {
                    var text = script.Substring(textStart, end - textStart).TrimEnd();
                    statements.Add(new ScriptStatement(text, firstLine, leadingWords.ToArray(), hasDataChangingWord));
                }
                textStart = -1;
                firstLine = 0;
                parenDepth = 0;
                beginDepth = 0;
                leadingWords = new List<string>(LeadingWordCount);
                hasDataChangingWord = false;
            }

            while (i < length)
            {
                var c = script[i];

                if (c == '\n')
                {
                    line++;
                    i++;
                    continue;
                }
                if (char.IsWhiteSpace(c))
                {
                    i++;
                    continue;
                }

                // Rule 1: a line comment.
                if (c == '-' && Peek(script, i + 1) == '-')
                {
                    StartText();
                    while (i < length && script[i] != '\n')
                    {
                        i++;
                    }
                    continue;
                }

                // Rule 2: a block comment; they nest, as in PostgreSQL.
                if (c == '/' && Peek(script, i + 1) == '*')
                {
                    StartText();
                    var depth = 1;
                    i += 2;
                    while (i < length && depth > 0)
                    {
                        if (script[i] == '/' && Peek(script, i + 1) == '*')
                        {
                            depth++;
                            i += 2;
                        }
                        else if (script[i] == '*' && Peek(script, i + 1) == '/')
                        {
                            depth--;
                            i += 2;
                        }
                        else
                        {
                            if (script[i] == '\n')
                            {
                                line++;
                            }
                            i++;
                        }
                    }
                    continue;
                }

                StartText();

                // Rule 3: a string. In an escape string (E'...') a backslash also takes the next character.
                if (c == '\'')
                {
                    MarkSignificant();
                    var isEscapeString = i > 0 && (script[i - 1] is 'E' or 'e') && !IsWordPartBefore(script, i - 1);
                    i++;
                    while (i < length)
                    {
                        if (script[i] == '\\' && isEscapeString && i + 1 < length)
                        {
                            if (script[i + 1] == '\n')
                            {
                                line++;
                            }
                            i += 2;
                            continue;
                        }
                        if (script[i] == '\'')
                        {
                            if (Peek(script, i + 1) == '\'')
                            {
                                i += 2;
                                continue;
                            }
                            i++;
                            break;
                        }
                        if (script[i] == '\n')
                        {
                            line++;
                        }
                        i++;
                    }
                    continue;
                }

                // Rule 4: a quoted identifier.
                if (c == '"')
                {
                    MarkSignificant();
                    i++;
                    while (i < length)
                    {
                        if (script[i] == '"')
                        {
                            if (Peek(script, i + 1) == '"')
                            {
                                i += 2;
                                continue;
                            }
                            i++;
                            break;
                        }
                        if (script[i] == '\n')
                        {
                            line++;
                        }
                        i++;
                    }
                    continue;
                }

                // Rule 5: dollar-quoted text, $tag$ ... $tag$.
                if (c == '$')
                {
                    MarkSignificant();
                    var tagLength = DollarTagLength(script, i);
                    if (tagLength > 0)
                    {
                        var tag = script.Substring(i, tagLength);
                        i += tagLength;
                        var close = script.IndexOf(tag, i, StringComparison.Ordinal);
                        var end = close < 0 ? length : close + tagLength;
                        for (; i < end; i++)
                        {
                            if (script[i] == '\n')
                            {
                                line++;
                            }
                        }
                    }
                    else
                    {
                        i++;
                    }
                    continue;
                }

                // Rule 6: a number; 1e5 and 0x1F are not words.
                if (IsAsciiDigit(c))
                {
                    MarkSignificant();
                    while (i < length && (IsAsciiLetter(script[i]) || IsAsciiDigit(script[i]) || script[i] == '_'))
                    {
                        i++;
                    }
                    continue;
                }

                // Rule 7: a bare word. The whole word is read, so the $ in a$b$c never starts a dollar quote.
                if (IsWordStart(c))
                {
                    MarkSignificant();
                    var start = i;
                    i++;
                    while (i < length && (IsWordStart(script[i]) || IsAsciiDigit(script[i]) || script[i] == '$'))
                    {
                        i++;
                    }
                    var word = script.Substring(start, i - start).ToUpperInvariant();

                    if (leadingWords.Count < LeadingWordCount)
                    {
                        leadingWords.Add(word);
                    }
                    if (word is "INSERT" or "UPDATE" or "DELETE" or "MERGE")
                    {
                        hasDataChangingWord = true;
                    }
                    if (parenDepth == 0 && IsRoutineDefinition(leadingWords))
                    {
                        // Keeps the semicolons of a BEGIN ATOMIC ... END body inside the statement (psql's heuristic).
                        if (word == "BEGIN")
                        {
                            beginDepth++;
                        }
                        else if (word == "CASE" && beginDepth >= 1)
                        {
                            beginDepth++;
                        }
                        else if (word == "END" && beginDepth > 0)
                        {
                            beginDepth--;
                        }
                    }
                    continue;
                }

                // Rule 8: parentheses (CREATE RULE ... DO ALSO (a; b) has semicolons inside).
                if (c == '(')
                {
                    MarkSignificant();
                    parenDepth++;
                    i++;
                    continue;
                }
                if (c == ')')
                {
                    MarkSignificant();
                    if (parenDepth > 0)
                    {
                        parenDepth--;
                    }
                    i++;
                    continue;
                }

                // Rule 9: the end of the statement.
                if (c == ';' && parenDepth == 0 && beginDepth == 0)
                {
                    EndStatement(i);
                    i++;
                    continue;
                }

                // Rule 10: any other character, including a semicolon that does not split.
                MarkSignificant();
                i++;
            }

            // The script's end ends the last statement.
            if (textStart >= 0)
            {
                EndStatement(length);
            }

            return statements;
        }

        private static char Peek(string s, int index) => index < s.Length ? s[index] : '\0';

        private static bool IsAsciiDigit(char c) => c is >= '0' and <= '9';

        private static bool IsAsciiLetter(char c) => c is (>= 'a' and <= 'z') or (>= 'A' and <= 'Z');

        // A letter, an underscore or any character from U+0080 up, as PostgreSQL allows in identifiers.
        private static bool IsWordStart(char c) => IsAsciiLetter(c) || c == '_' || c >= '\u0080';

        // True when the character at index belongs to a longer word (so an "e" there is not the E of E'...').
        private static bool IsWordPartBefore(string s, int index) =>
            index > 0 && (IsWordStart(s[index - 1]) || IsAsciiDigit(s[index - 1]) || s[index - 1] == '$');

        // Length of the dollar-quote tag ($tag$) that starts at index, or 0 when the text there is no tag.
        private static int DollarTagLength(string s, int index)
        {
            var j = index + 1;
            if (j < s.Length && IsWordStart(s[j]))
            {
                j++;
                while (j < s.Length && (IsWordStart(s[j]) || IsAsciiDigit(s[j])))
                {
                    j++;
                }
            }
            return j < s.Length && s[j] == '$' ? j - index + 1 : 0;
        }

        private static bool IsRoutineDefinition(IReadOnlyList<string> words)
        {
            if (words.Count < 2 || words[0] != "CREATE")
            {
                return false;
            }
            if (words[1] is "FUNCTION" or "PROCEDURE")
            {
                return true;
            }
            return words.Count >= 4 && words[1] == "OR" && words[2] == "REPLACE" && (words[3] is "FUNCTION" or "PROCEDURE");
        }
    }
}
