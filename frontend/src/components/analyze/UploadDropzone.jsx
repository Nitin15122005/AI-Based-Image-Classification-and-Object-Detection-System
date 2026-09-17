import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { classNames } from '../../utils/format.js';
import { ACCEPTED_IMAGE_TYPES } from '../../services/api.js';

export default function UploadDropzone({ onFileSelected, onSampleSelected, samples = [] }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragIn = useCallback((event) => {
    handleDrag(event);
    if (event.dataTransfer?.items?.length) setDragActive(true);
  }, [handleDrag]);

  const handleDragOut = useCallback((event) => {
    handleDrag(event);
    setDragActive(false);
  }, [handleDrag]);

  const handleDrop = useCallback(
    (event) => {
      handleDrag(event);
      setDragActive(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) onFileSelected(file);
    },
    [handleDrag, onFileSelected],
  );

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    event.target.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image by dragging it here or browsing your device"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragOver={handleDrag}
      onDragLeave={handleDragOut}
      onDrop={handleDrop}
      className={classNames(
        'relative group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-xl shadow-sm transition-all duration-300',
        dragActive
          ? 'ring-2 ring-secondary bg-surface-container-low shadow-md'
          : 'hover:shadow-md hover:bg-surface-container-low',
      )}
    >
      <div className="flex flex-col items-center justify-center text-center py-space-lg space-y-space-md pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary transition-transform group-hover:scale-105 duration-200">
          <UploadCloud className="w-8 h-8" strokeWidth={1.75} />
        </div>
        <div className="space-y-space-xs max-w-md">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            {dragActive ? 'Drop the image to upload' : 'Drag and drop an image here, or browse from your device'}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            JPG, PNG, or WEBP up to 25MB.
          </p>
        </div>
        {samples.length > 0 && (
          <div className="pt-space-xs flex flex-wrap items-center justify-center gap-space-xs pointer-events-auto">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Or try a sample:</span>
            {samples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSampleSelected(sample.id);
                }}
                className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
