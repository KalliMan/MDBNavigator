import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { ResultSet } from '../../models/databaseCommand/result/resultSet';
import { copyText } from '../../utils/clipboard';
import ResultCsvView from '../databaseCommand/ResultCsvView';
import PlanDetails from './PlanDetails';
import PlanTree from './PlanTree';
import { formatPlanValue, parsePlan, planKeyAction, visiblePlanRows } from './queryPlan';
import type { ParsedPlan } from './queryPlan';

interface Props {
  // The plan run's only result set: one row, one cell with EXPLAIN's JSON.
  resultSet: ResultSet;
  tabs: ReactNode;
  // This result's tab is the one on screen (the Error tab of a failed run can be in front instead).
  isActive: boolean;
}

type PlanViewMode = 'tree' | 'json';

const MODES: { mode: PlanViewMode; label: string }[] = [
  { mode: 'tree', label: 'Tree' },
  { mode: 'json', label: 'JSON' },
];

function summaryOf(plan: ParsedPlan): ReactNode {
  if (!plan.analyzed) {
    return `Estimated cost ${formatPlanValue(plan.totalCost)} · not run`;
  }
  const times = [
    plan.planningMs !== null ? `Planning ${formatPlanValue(plan.planningMs)} ms` : null,
    plan.executionMs !== null ? `Execution ${formatPlanValue(plan.executionMs)} ms` : null,
  ].filter(Boolean).join(' · ');
  return (
    <>
      {times && `${times} · `}
      <span title="EXPLAIN ANALYZE ran the statement inside a transaction and rolled it back.">rolled back</span>
    </>
  );
}

// The plan of one statement (Explain, Explain Analyze) in place of a result grid: a toolbar with the summary, a
// Tree | JSON switch and Copy JSON, then the steps as a tree with the selected step's details beside it.
export default function QueryPlanView({ resultSet, tabs, isActive }: Props) {
  const cell = resultSet.rows[0]?.[0] ?? null;
  const parsed = useMemo(() => parsePlan(cell), [cell]);
  const [mode, setMode] = useState<PlanViewMode>('tree');
  // The root at first; ids are paths, so a new plan with the same shape keeps its selection.
  const [selectedId, setSelectedId] = useState('0');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const plan = 'plan' in parsed ? parsed.plan : null;

  function handleCopy() {
    if (!plan) {
      return;
    }
    copyText(plan.json)
      .then(() => toast.success('Plan copied'))
      .catch(() => toast.error("Couldn't copy to the clipboard. It needs HTTPS or localhost."));
  }

  function handleToggle(id: string) {
    setCollapsed(current => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  // A plan from a new run can be smaller than the one before; the selection must still name a step.
  const selected = plan ? findNode(plan, selectedId) ?? plan.root : null;

  function handleKey(key: string): boolean {
    if (!plan || !selected) {
      return false;
    }
    const action = planKeyAction(visiblePlanRows(plan.root, collapsed), selected.id, key, collapsed);
    if (!action) {
      return false;
    }
    setSelectedId(action.selectedId);
    setCollapsed(action.collapsed);
    return true;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 flex-none items-center gap-2 border-b border-line bg-chrome pr-3 text-xs">
        {tabs}
        <span className="flex-1" />
        {plan && <span className="truncate text-fg-muted">{summaryOf(plan)}</span>}
        {plan && (
          <div className="flex h-6 flex-none overflow-hidden rounded-[3px] border border-line">
            {MODES.map((m, index) => (
              <button
                key={m.mode}
                type="button"
                aria-pressed={mode === m.mode}
                onClick={() => setMode(m.mode)}
                className={`px-2.5 cursor-pointer ${index > 0 ? 'border-l border-line ' : ''}${
                  mode === m.mode ? 'bg-canvas font-semibold text-fg' : 'text-fg-muted hover:bg-hover'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        {plan && (
          <button
            type="button"
            onClick={handleCopy}
            className="h-6 flex-none rounded-[3px] border border-line px-2.5 text-fg hover:bg-hover cursor-pointer"
          >
            Copy JSON
          </button>
        )}
      </div>
      <div className="@container min-h-0 flex-1">
        {plan && selected ? (
          <>
            {/* Both stay mounted, one hidden: the tree keeps its scroll position and folds when the view switches. */}
            <div className={mode === 'tree' ? 'flex h-full flex-col @min-[900px]:flex-row' : 'hidden'}>
              <div className="min-h-0 min-w-0 flex-1">
                <PlanTree
                  plan={plan}
                  selectedId={selected.id}
                  collapsed={collapsed}
                  onSelect={setSelectedId}
                  onToggle={handleToggle}
                  onKey={handleKey}
                />
              </div>
              <div className="h-48 flex-none border-t border-line @min-[900px]:h-auto @min-[900px]:w-80 @min-[900px]:border-l @min-[900px]:border-t-0">
                <PlanDetails node={selected} analyzed={plan.analyzed} />
              </div>
            </div>
            <div className={mode === 'json' ? 'h-full' : 'hidden'}>
              {isActive && <ResultCsvView text={plan.json} />}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-none px-4 py-3 text-danger">{'error' in parsed ? parsed.error : ''}</div>
            <div className="min-h-0 flex-1">
              {isActive && <ResultCsvView text={typeof cell === 'string' ? cell : JSON.stringify(cell)} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function findNode(plan: ParsedPlan, id: string) {
  const stack = [plan.root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.id === id) {
      return node;
    }
    stack.push(...node.children);
  }
  return undefined;
}
