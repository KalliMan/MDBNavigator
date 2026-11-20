import Checkbox from "../../ui/common/Checkbox";

interface Props {
  contactEmail: string;
  agreed: boolean;
  error?: string;
  onChange: (agreed: boolean) => void;
}

// The demo terms (version DEMO_TERMS_VERSION) and the box that agrees to them. A change to this text needs a new
// version, here and on the server. The 90 days are DemoTerms.VisitorRetentionDays on the server.
export default function DemoTerms({ contactEmail, agreed, error, onChange }: Props) {
  return (
    <div className="grid gap-2">
      <div className="rounded-[3px] border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-fg-muted">
        <p className="mb-1 font-semibold text-fg">Demo terms</p>
        <p>
          This demo is free, provided as is, for trying MDBNavigator only. It may change or stop at any time.
          By continuing you agree not to try to break, overload or get around its limits, and not to use it to reach
          or attack other systems. What you run is logged, and access can be ended at any time.
        </p>
        <p className="mt-1">
          Your name and email are kept for 90 days after your last visit, then deleted. To have them deleted sooner,
          write to <a href={`mailto:${contactEmail}`} className="font-medium text-accent-strong hover:underline">{contactEmail}</a>.
        </p>
      </div>
      <Checkbox checked={agreed} onChange={onChange}>
        <span className="text-sm text-fg">I agree to the demo terms</span>
      </Checkbox>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
