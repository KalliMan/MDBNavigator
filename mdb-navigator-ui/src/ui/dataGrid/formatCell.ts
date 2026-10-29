// Cells are single-line; very long values are cut for display (the full value comes with the cell viewer).
const MAX_DISPLAY_LENGTH = 1000;

export interface FormattedCell {
  text: string;
  isNull: boolean;
}

export function formatCell(value: unknown): FormattedCell {
  if (value === null || value === undefined) {
    return { text: 'NULL', isNull: true };
  }

  let text: string;
  if (typeof value === 'boolean') {
    text = value ? 'true' : 'false';
  } else if (typeof value === 'string') {
    text = value;
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    text = value.toString();
  } else {
    // json/jsonb and array columns arrive as objects
    text = JSON.stringify(value) ?? '';
  }

  return {
    text: text.length > MAX_DISPLAY_LENGTH ? text.slice(0, MAX_DISPLAY_LENGTH) + '…' : text,
    isNull: false
  };
}
