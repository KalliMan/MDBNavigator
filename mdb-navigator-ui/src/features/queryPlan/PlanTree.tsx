import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { formatPlanValue, formatShare, visiblePlanRows } from './queryPlan';
import type { ParsedPlan, PlanNode } from './queryPlan';

interface Props {
  plan: ParsedPlan;
  selectedId: string;
  collapsed: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  // A key pressed in the tree. True when it was handled (the browser's own action, such as scrolling, is then stopped).
  onKey: (key: string) => boolean;
}

// The same columns for the header and every row. Step takes what is left; the others have a fixed width.
const COLUMNS = 'grid grid-cols-[minmax(260px,1fr)_130px_56px_96px_120px] items-center gap-x-2';

function misestimateTitle(node: PlanNode): string {
  return `PostgreSQL expected ${formatPlanValue(node.estimatedRows)} rows per loop and got ${formatPlanValue(node.actualRows)}.`;
}

function fillClass(level: PlanNode['level']): string {
  return level === 'high' ? 'bg-danger' : level === 'medium' ? 'bg-warning' : 'bg-fg-faint';
}

// The plan as an indented tree, one row per step. The selected step shows in PlanDetails. Keyboard: the tree
// is one Tab stop and the arrow keys move inside it (planKeyAction), as in a file explorer.
export default function PlanTree({ plan, selectedId, collapsed, onSelect, onToggle, onKey }: Props) {
  const rows = visiblePlanRows(plan.root, collapsed);
  const treeRef = useRef<HTMLDivElement>(null);
  // True after a key moved the selection, so the new row is scrolled into view. A click needs no scrolling.
  const keyboardMove = useRef(false);

  useEffect(() => {
    if (keyboardMove.current) {
      keyboardMove.current = false;
      treeRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedId]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    keyboardMove.current = true;
    if (onKey(e.key)) {
      e.preventDefault();
    } else {
      keyboardMove.current = false;
    }
  }

  const analyzed = plan.analyzed;

  return (
    <div className="h-full overflow-auto bg-canvas text-[13px]">
      <div className="min-w-[760px]">
        <div className={`${COLUMNS} sticky top-0 z-10 h-7 border-b border-line bg-chrome px-1 text-xs text-fg-muted`}>
          <span className="pl-1">Step</span>
          <span>{analyzed ? 'Rows (est. → actual)' : 'Rows (est.)'}</span>
          <span className="text-right">{analyzed ? 'Loops' : ''}</span>
          <span className="text-right">{analyzed ? 'Own time' : 'Own cost'}</span>
          <span>Share</span>
        </div>
        <div
          ref={treeRef}
          role="tree"
          aria-label="Query plan"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          {rows.map(node => {
            const selected = node.id === selectedId;
            const hasChildren = node.children.length > 0;
            const open = !collapsed.has(node.id);
            return (
              <div
                key={node.id}
                role="treeitem"
                aria-level={node.depth + 1}
                aria-expanded={hasChildren ? open : undefined}
                aria-selected={selected}
                onClick={() => onSelect(node.id)}
                className={`${COLUMNS} h-6 cursor-default border-b border-line-subtle px-1 ${selected ? 'bg-selected text-on-selected' : 'hover:bg-hover'}`}
              >
                <span className="flex min-w-0 items-center whitespace-nowrap" style={{ paddingLeft: node.depth * 16 + 4 }}>
                  {hasChildren ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={open ? 'Collapse' : 'Expand'}
                      onClick={e => {
                        e.stopPropagation();
                        onToggle(node.id);
                      }}
                      className="flex size-4 flex-none items-center justify-center text-fg-muted hover:text-fg cursor-pointer"
                    >
                      <LuChevronRight size={14} className={open ? 'rotate-90' : ''} aria-hidden="true" />
                    </button>
                  ) : (
                    // Same width as the chevron, so steps line up with their siblings.
                    <span className="size-4 flex-none" aria-hidden="true" />
                  )}
                  <span className="ml-1 min-w-0 truncate">
                    {node.subplanName && <span className="text-fg-muted">{node.subplanName} </span>}
                    <span className="font-medium">{node.label}</span>
                    {node.neverExecuted && <span className="ml-2 text-fg-faint">never executed</span>}
                  </span>
                  {node.misestimate && (
                    <span className="ml-2 flex-none text-xs text-warning" title={misestimateTitle(node)}>
                      rows ×{node.misestimate.factor} {node.misestimate.direction}
                    </span>
                  )}
                </span>
                <span className="truncate tabular-nums">
                  {analyzed
                    ? `${formatPlanValue(node.estimatedRows)} → ${formatPlanValue(node.actualRows)}`
                    : formatPlanValue(node.estimatedRows)}
                </span>
                <span className="text-right tabular-nums">{analyzed ? formatPlanValue(node.loops) : ''}</span>
                <span className={`text-right tabular-nums ${node.level === 'high' ? 'font-semibold' : ''}`}>
                  {analyzed ? `${formatPlanValue(node.ownMs)} ms` : formatPlanValue(node.ownCost)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-16 flex-none rounded bg-hover" aria-hidden="true">
                    <span className={`block h-full rounded ${fillClass(node.level)}`} style={{ width: `${node.share * 100}%` }} />
                  </span>
                  <span className="tabular-nums">{formatShare(node.share)}</span>
                </span>
              </div>
            );
          })}
        </div>
        {plan.triggers.length > 0 && (
          <div className="px-3 py-2 text-xs text-fg-muted">
            {plan.triggers.map((trigger, index) => (
              <div key={`${trigger.name}-${index}`}>
                Trigger {trigger.name}{trigger.relation ? ` on ${trigger.relation}` : ''}: {formatPlanValue(trigger.ms)} ms, {formatPlanValue(trigger.calls)} {trigger.calls === 1 ? 'call' : 'calls'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
