import { useState } from 'react';
import { ShieldCheck, BookmarkPlus, BookmarkCheck, RotateCcw, Trash2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

export default function ActionFooter({ onRunAgain, onDelete, showDelete = false }) {
  const [saved, setSaved] = useState(true); // analyses are persisted the moment they're created

  return (
    <Card className="flex flex-col md:flex-row items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-md">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
          <ShieldCheck className="w-[22px] h-[22px]" />
        </div>
        <div>
          <h4 className="font-headline-sm text-headline-sm text-primary">Analysis saved</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            This result is stored in your history and ready for review any time.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-space-xs">
        <Button variant="subtle" size="sm" onClick={() => setSaved(true)}>
          {saved ? <BookmarkCheck className="w-[18px] h-[18px]" /> : <BookmarkPlus className="w-[18px] h-[18px]" />}
          {saved ? 'Saved to History' : 'Save to History'}
        </Button>
        {onRunAgain && (
          <Button variant="subtle" size="sm" onClick={onRunAgain}>
            <RotateCcw className="w-[18px] h-[18px]" />
            Run Again
          </Button>
        )}
        {showDelete && onDelete && (
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 className="w-[18px] h-[18px]" />
            Delete Record
          </Button>
        )}
      </div>
    </Card>
  );
}
