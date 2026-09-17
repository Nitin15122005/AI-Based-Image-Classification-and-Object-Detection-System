// API-ready service layer. Every function here is called by pages/components
// instead of using fetch() directly, so swapping the mock implementations for
// real FastAPI calls later (see project-brain/03_ML_BACKEND.md for the planned
// endpoints) only requires editing this file.
import {
  listAnalyses,
  findAnalysis,
  addAnalysis,
  removeAnalysis,
  pickRandomTemplate,
} from './mockStore.js';
import {
  MODEL_INFO,
  DETECTION_METRICS,
  CLASSIFICATION_METRICS,
  DETECTION_TRAINING_CURVE,
  CLASSIFICATION_TRAINING_CURVE,
  CONFUSION_MATRIX,
  CONFUSION_MATRIX_CLASSES,
  PER_CLASS_METRICS,
  SAMPLE_TEMPLATES,
} from '../data/mockData.js';

const MOCK_LATENCY_MS = 450;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB, matches the Analyze page copy

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

export function validateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a JPG, PNG, or WEBP image.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large. Maximum upload size is 25MB.';
  }
  return null;
}

/**
 * Shared mock-inference core. Filters a template's detections by the chosen
 * confidence threshold, recomputes summary stats, and stores the result —
 * the same shape a real POST /api/analyze response would return.
 */
async function runMockInference({ template, overrides, settings, onStageChange, prepDelay }) {
  const threshold = settings.confidenceThreshold ?? 0.25;
  const detectionEnabled = settings.detectionEnabled ?? true;
  const classificationEnabled = settings.classificationEnabled ?? true;

  onStageChange?.('preparing');
  await delay(prepDelay ?? MOCK_LATENCY_MS);

  onStageChange?.('detecting');
  await delay(MOCK_LATENCY_MS);
  const detections = detectionEnabled
    ? template.detections.filter((d) => d.detectionConfidence >= threshold)
    : [];

  onStageChange?.('classifying');
  await delay(MOCK_LATENCY_MS);
  const avgDetectionConfidence = detections.length
    ? detections.reduce((sum, d) => sum + d.detectionConfidence, 0) / detections.length
    : 0;
  const classCounts = detections.reduce((acc, d) => {
    acc[d.label] = (acc[d.label] || 0) + 1;
    return acc;
  }, {});

  onStageChange?.('finalizing');
  await delay(Math.round(MOCK_LATENCY_MS * 0.6));

  const analysis = {
    id: `a${Date.now()}`,
    createdAt: new Date().toISOString(),
    processingTimeMs: 480 + Math.round(Math.random() * 640),
    sceneClassification: template.sceneClassification,
    sceneConfidence: template.sceneConfidence,
    detections,
    topPredictions: classificationEnabled ? template.topPredictions : [],
    avgDetectionConfidence,
    classCounts,
    distinctClasses: Object.keys(classCounts).length,
    settings: { threshold, detectionEnabled, classificationEnabled },
    ...overrides,
  };

  addAnalysis(analysis);
  return analysis;
}

/**
 * Runs the (mock) YOLO11s + ResNet50 pipeline against an uploaded file.
 * Real backend equivalent: POST /api/analyze (multipart form + settings).
 */
export async function analyzeImage(file, settings = {}, { onStageChange } = {}) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const dataUrl = await readFileAsDataUrl(file);
  const { width, height } = await readImageDimensions(dataUrl);
  const template = pickRandomTemplate();

  return runMockInference({
    template,
    settings,
    onStageChange,
    overrides: {
      filename: file.name,
      width,
      height,
      fileSizeBytes: file.size,
      format: (file.type.split('/')[1] || 'jpeg').toUpperCase(),
      originalImage: dataUrl,
      annotatedImage: dataUrl,
    },
  });
}

/**
 * Re-runs the pipeline against an already-analyzed image (Results/History
 * "Re-run" and "Run Again" actions), producing a new history entry.
 */
export async function rerunAnalysis(sourceAnalysis, settingsOverride) {
  const settings = settingsOverride || {
    confidenceThreshold: sourceAnalysis.settings?.threshold ?? 0.25,
    detectionEnabled: sourceAnalysis.settings?.detectionEnabled ?? true,
    classificationEnabled: sourceAnalysis.settings?.classificationEnabled ?? true,
  };

  return runMockInference({
    template: sourceAnalysis,
    settings,
    prepDelay: Math.round(MOCK_LATENCY_MS * 0.5),
    overrides: {
      filename: sourceAnalysis.filename,
      width: sourceAnalysis.width,
      height: sourceAnalysis.height,
      fileSizeBytes: sourceAnalysis.fileSizeBytes,
      format: sourceAnalysis.format,
      originalImage: sourceAnalysis.originalImage,
      annotatedImage: sourceAnalysis.annotatedImage,
    },
  });
}

/** Lets the Analyze page offer ready-made images without a real upload. */
export function getSampleImages() {
  return SAMPLE_TEMPLATES;
}

/**
 * Same pipeline as analyzeImage(), but starting from one of the bundled
 * sample images instead of a user-uploaded file (no FileReader step needed).
 */
export async function analyzeSampleImage(sampleId, settings = {}, { onStageChange } = {}) {
  const sample = SAMPLE_TEMPLATES.find((s) => s.id === sampleId);
  if (!sample) throw new Error('Unknown sample image.');
  const { analysis: template } = sample;

  return runMockInference({
    template,
    settings,
    onStageChange,
    prepDelay: Math.round(MOCK_LATENCY_MS * 0.5),
    overrides: {
      filename: template.filename,
      width: template.width,
      height: template.height,
      fileSizeBytes: template.fileSizeBytes,
      format: template.format,
      originalImage: template.originalImage,
      annotatedImage: template.annotatedImage,
    },
  });
}

/** Real backend equivalent: GET /api/history */
export async function getHistory({ search = '', sort = 'newest' } = {}) {
  await delay(280);
  let items = listAnalyses();

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (a) =>
        a.filename.toLowerCase().includes(q) ||
        Object.keys(a.classCounts || {}).some((c) => c.toLowerCase().includes(q)),
    );
  }

  switch (sort) {
    case 'confidence':
      items = [...items].sort((a, b) => b.avgDetectionConfidence - a.avgDetectionConfidence);
      break;
    case 'objects':
      items = [...items].sort((a, b) => b.detections.length - a.detections.length);
      break;
    case 'oldest':
      items = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    default:
      break; // listAnalyses() already returns newest-first
  }

  return items;
}

/** Real backend equivalent: GET /api/history/{id} */
export async function getHistoryItem(id) {
  await delay(220);
  const item = findAnalysis(id);
  if (!item) throw new Error(`No analysis found with id "${id}".`);
  return item;
}

/** Real backend equivalent: DELETE /api/history/{id} */
export async function deleteHistoryItem(id) {
  await delay(220);
  removeAnalysis(id);
  return { success: true };
}

/** Real backend equivalent: GET /api/metrics */
export async function getModelMetrics() {
  await delay(320);
  return {
    modelInfo: MODEL_INFO,
    detection: DETECTION_METRICS,
    classification: CLASSIFICATION_METRICS,
    detectionTrainingCurve: DETECTION_TRAINING_CURVE,
    classificationTrainingCurve: CLASSIFICATION_TRAINING_CURVE,
    confusionMatrix: CONFUSION_MATRIX,
    confusionMatrixClasses: CONFUSION_MATRIX_CLASSES,
    perClassMetrics: PER_CLASS_METRICS,
  };
}

/**
 * Triggers a client-side download of either the annotated image or the raw
 * result JSON. Real backend equivalent: GET /api/media/{path} for the image,
 * or serializing the same payload returned by /api/analyze for the JSON.
 */
export function downloadResult(analysis, format = 'json') {
  const baseName = analysis.filename.replace(/\.[^.]+$/, '');
  const link = document.createElement('a');

  if (format === 'image') {
    link.href = analysis.annotatedImage;
    link.download = `${baseName}_annotated.png`;
  } else {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}_visionai_result.json`;
  }

  document.body.appendChild(link);
  link.click();
  link.remove();
  if (format !== 'image') URL.revokeObjectURL(link.href);
}
