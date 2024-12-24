import { useState } from 'react';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';

interface Props {
  initialQuery?: string;
  execute?(query: string): void;
}

function DatabaseCommand({ initialQuery, execute }: Props) {
  const [query, setScript] = useState<string>(initialQuery ? initialQuery : '');

  return (
    <div className="border h-full">
      <div className="h-[90%]">
        <textarea
          className="w-full h-full flex flex-grow overflow-auto bg-stone-100 p-2 resize-none"
          name=""
          id=""
          placeholder="Put your query here"
          value={query}
          onChange={e => setScript(e.target.value)}
        >
        </textarea>
      </div>
      <div className="">
        <Button type={ButtonType.primary} onClick={() => execute?.(query)}>Execute</Button>
      </div>
    </div>
  );
}

export default DatabaseCommand;
