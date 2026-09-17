import { classNames } from '../../utils/format.js';

function cellStyle(value, isDiagonal) {
  if (isDiagonal) {
    return { backgroundColor: '#0058be', color: '#ffffff', fontWeight: 700 };
  }
  if (value >= 0.05) {
    return { backgroundColor: 'rgba(0, 88, 190, 0.28)', color: '#1a1c1b', fontWeight: 600 };
  }
  return { backgroundColor: '#eeeeeb', color: '#45474c' };
}

export default function ConfusionMatrixGrid({ classes, matrix }) {
  return (
    <div className="overflow-x-auto w-full">
      <div className="min-w-[760px] p-space-sm bg-surface-container-low rounded-lg flex flex-col items-center">
        <div className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-space-xs">
          Predicted Class &rarr;
        </div>
        <div className="flex items-stretch w-full">
          <div className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant mr-space-xs shrink-0">
            Ground Truth &rarr;
          </div>
          <div className="flex-grow">
            <div
              className="grid gap-1 text-center font-code-sm text-code-sm mb-1 text-on-surface-variant"
              style={{ gridTemplateColumns: `120px repeat(${classes.length}, minmax(0, 1fr))` }}
            >
              <div />
              {classes.map((cls) => (
                <div key={cls} className="p-1 font-semibold truncate">
                  {cls}
                </div>
              ))}
            </div>
            {classes.map((rowClass, rowIndex) => (
              <div
                key={rowClass}
                className="grid gap-1 items-center text-center font-code-sm text-code-sm mb-1"
                style={{ gridTemplateColumns: `120px repeat(${classes.length}, minmax(0, 1fr))` }}
              >
                <div className="font-semibold text-left truncate text-on-surface pr-1">{rowClass}</div>
                {matrix[rowIndex].map((value, colIndex) => (
                  <div
                    key={`${rowClass}-${classes[colIndex]}`}
                    className={classNames('p-2 rounded')}
                    style={cellStyle(value, rowIndex === colIndex)}
                    title={`${rowClass} -> ${classes[colIndex]}: ${value.toFixed(2)}`}
                  >
                    {value.toFixed(2)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-space-md mt-space-md text-on-surface-variant font-label-sm text-label-sm">
        <span>Normalized scale:</span>
        <LegendSwatch color="#eeeeeb" label="< 0.05 (rare error)" />
        <LegendSwatch color="rgba(0, 88, 190, 0.28)" label="0.05–0.10 (ambiguity)" />
        <LegendSwatch color="#0058be" label="Diagonal (correct top-1)" textColor="#ffffff" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }) {
  return (
    <div className="flex items-center gap-1 font-code-sm text-code-sm">
      <span className="w-5 h-4 rounded inline-block" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
