import ModalWindow from '../../ui/modalWindow/ModalWindow';
import Button from '../../ui/common/Button';
import { ButtonType } from '../../ui/common/ButtonType.enum';

interface Props {
  onConfirm: () => void;
  onClose: () => void;
}

// ModalWindow hands onCloseModal to its child, which must therefore be a component; the dialog closes through
// its own onClose and doesn't need it.
interface BodyProps extends Props {
  onCloseModal?: () => void;
}

function AnalyzeConfirmBody({ onConfirm, onClose }: BodyProps) {
  return (
    <div className="flex w-[min(520px,calc(100vw-4rem))] flex-col">
      <p className="px-4 py-3 leading-5">
        EXPLAIN ANALYZE really runs the statement to measure it. MDBNavigator runs it inside a transaction and rolls it
        back, so its changes to the data are undone. A rollback can&apos;t undo everything: sequence values stay used, and
        anything the statement does outside this database (for example through dblink) stays done.
      </p>
      <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
        <Button type={ButtonType.secondary} onClick={onClose}>
          Cancel
        </Button>
        <Button type={ButtonType.primary} onClick={onConfirm}>
          Run and roll back
        </Button>
      </div>
    </div>
  );
}

// Asked before Explain Analyze when the statement may change data (mayChangeData). Confirm runs it; closing the
// dialog by any other way runs nothing.
export default function AnalyzeConfirm({ onConfirm, onClose }: Props) {
  return (
    <ModalWindow name="analyzeConfirm" title="Explain Analyze runs this statement" onClose={onClose}>
      <AnalyzeConfirmBody onConfirm={onConfirm} onClose={onClose} />
    </ModalWindow>
  );
}
