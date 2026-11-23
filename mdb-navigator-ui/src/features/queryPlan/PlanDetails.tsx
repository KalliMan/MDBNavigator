import { formatPlanValue, formatShare } from './queryPlan';
import type { PlanNode } from './queryPlan';

interface Props {
  node: PlanNode;
  analyzed: boolean;
}

// The selected step: its computed values first (own time or cost, share), then every property EXPLAIN gave it.
export default function PlanDetails({ node, analyzed }: Props) {
  const computed: [string, string][] = [
    analyzed ? ['Own time', `${formatPlanValue(node.ownMs)} ms`] : ['Own cost', formatPlanValue(node.ownCost)],
    ['Share', formatShare(node.share)],
  ];

  return (
    <div className="h-full overflow-auto bg-canvas px-3 py-2">
      <div className="mb-2 font-semibold">{node.label}</div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
        {[...computed, ...node.details].map(([key, value], index) => (
          <div key={`${key}-${index}`} className="col-span-2 grid grid-cols-subgrid">
            <dt className="text-fg-muted">{key}</dt>
            <dd className="select-text break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
