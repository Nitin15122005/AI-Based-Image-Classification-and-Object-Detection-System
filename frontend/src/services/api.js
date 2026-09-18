// API-ready service layer. Every function here is called by pages/components
// instead of using fetch() directly, so swapping the mock implementations for
// real FastAPI calls later (see project-brain/03_ML_BACKEND.md for the planned
// endpoints) only requires editing this file.
//
// Real-backend integration: set VITE_API_BASE_URL (see .env.example) to point
// at a running FastAPI instance (see backend/README.md). When unset, every
// function below falls back to the local mock store exactly as before — the
// mock path is untouched. When set, requests go to the real API and its
// snake_case response is adapted into the exact shape these functions have
// always returned, so no page or component needed to change.
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

// ---------------------------------------------------------------------------
// Real-backend switch
// ---------------------------------------------------------------------------

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const USE_REAL_API = Boolean(API_BASE_URL);
const API_V1 = `${API_BASE_URL}/api/v1`;

/** Whether the app is configured to call a real FastAPI backend (vs. the
 * local mock store). Used by the navbar's live status indicator. */
export const isRealApiConfigured = USE_REAL_API;

const DETECTION_COLOR_PALETTE = ['secondary', 'emerald', 'amber', 'purple'];
const DETECTION_HEX_BY_COLOR_CLASS = {
  secondary: '#2170e4',
  emerald: '#10b981',
  amber: '#f59e0b',
  purple: '#9333ea',
};

async function parseErrorMessage(response, fallback) {
  try {
    const body = await response.json();
    return body?.detail || fallback;
  } catch {
    return fallback;
  }
}

function pixelBboxToPercent(bbox, width, height) {
  if (!width || !height) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: (bbox.x1 / width) * 100,
    y: (bbox.y1 / height) * 100,
    width: ((bbox.x2 - bbox.x1) / width) * 100,
    height: ((bbox.y2 - bbox.y1) / height) * 100,
  };
}

/** Backend AnalysisResponse (snake_case) -> the camelCase shape every page/
 * component already consumes (same shape the mock store has always used). */
function transformAnalysisResponse(data) {
  const detections = (data.detections || []).map((d, index) => {
    const colorClass = DETECTION_COLOR_PALETTE[index % DETECTION_COLOR_PALETTE.length];
    return {
      id: d.id,
      label: d.class_name,
      colorClass,
      hexColor: DETECTION_HEX_BY_COLOR_CLASS[colorClass],
      bbox: pixelBboxToPercent(d.bbox, data.width, data.height),
      detectionConfidence: d.detection_confidence,
      classification: d.classification.class_name,
      classificationConfidence: d.classification.confidence,
    };
  });

  const classCounts = detections.reduce((acc, d) => {
    acc[d.label] = (acc[d.label] || 0) + 1;
    return acc;
  }, {});

  const topPrediction = data.top_classifications?.[0];

  return {
    id: data.id,
    filename: data.filename,
    createdAt: data.created_at,
    processingTimeMs: Math.round((data.processing_time || 0) * 1000),
    width: data.width,
    height: data.height,
    fileSizeBytes: data.file_size_bytes,
    format: (data.image_format || 'jpeg').toUpperCase(),
    originalImage: `${API_BASE_URL}${data.original_image_url}`,
    annotatedImage: data.annotated_image_url ? `${API_BASE_URL}${data.annotated_image_url}` : null,
    sceneClassification: topPrediction?.class_name || data.summary || 'Unclassified scene',
    sceneConfidence: topPrediction?.confidence || 0,
    detections,
    topPredictions: (data.top_classifications || []).map((t) => ({
      class: t.class_name,
      confidence: t.confidence,
    })),
    avgDetectionConfidence: data.average_confidence,
    classCounts,
    distinctClasses: Object.keys(classCounts).length,
    settings: {
      threshold: data.confidence_threshold,
      detectionEnabled: data.detection_enabled,
      classificationEnabled: data.classification_enabled,
    },
  };
}

function transformModelsAndMetrics(models, metrics) {
  const toModelInfo = (m) => ({
    name: m.name,
    role: m.purpose,
    weightsFile: m.weights_path?.split(/[/\\]/).pop() || m.weights_path,
    backbone: m.architecture,
    inputSize: m.name === 'YOLO11s' ? '640 × 640 × 3 px' : '224 × 224 × 3 px',
    framework: m.framework,
    taxonomy: `${m.class_count} COCO classes`,
    params: m.status,
    mode: m.mode,
    status: m.status,
  });

  return {
    modelInfo: {
      detection: toModelInfo(models.detection),
      classification: toModelInfo(models.classification),
      system: {
        dataset: metrics.dataset.name,
        numClasses: metrics.dataset.num_classes,
        framework: models.detection.framework,
        trainingHardware: metrics.device.training_hardware,
        servingDevice: metrics.device.serving_device,
        // Real classification fine-tuning config (see experiment_config.json /
        // coco_detection_classification.ipynb) — the pretrained detector isn't
        // trained by this project, so there's no equivalent detector config.
        batchSize: 16,
        optimizer: 'AdamW (two-phase: head lr=1e-3, fine-tune lr=1e-4)',
        epochs: 15,
      },
    },
    detection: {
      precision: metrics.detection.precision,
      recall: metrics.detection.recall,
      map50: metrics.detection.map50,
      map5095: metrics.detection.map50_95,
    },
    classification: {
      top1: metrics.classification.top1_accuracy,
      top5: metrics.classification.top5_accuracy,
      balancedAccuracy: metrics.classification.balanced_accuracy,
      macroF1: metrics.classification.macro_f1,
      weightedF1: metrics.classification.weighted_f1,
    },
    detectionTrainingCurve: metrics.training_history.detection.map((e) => ({
      epoch: e.epoch,
      boxLoss: e.box_loss,
      classLoss: e.class_loss,
      map50: e.map50,
    })),
    classificationTrainingCurve: metrics.training_history.classification.map((e) => ({
      epoch: e.epoch,
      trainAcc: e.train_accuracy,
      valAcc: e.val_accuracy,
      valLoss: e.val_loss,
    })),
    confusionMatrix: metrics.confusion_matrix.matrix,
    confusionMatrixClasses: metrics.confusion_matrix.classes,
    perClassMetrics: metrics.per_class_metrics,
  };
}

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

async function realAnalyzeRequest(file, settings, onStageChange) {
  onStageChange?.('preparing');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('confidence_threshold', String(settings.confidenceThreshold ?? 0.25));
  formData.append('detection_enabled', String(settings.detectionEnabled ?? true));
  formData.append('classification_enabled', String(settings.classificationEnabled ?? true));

  onStageChange?.('detecting');
  const response = await fetch(`${API_V1}/analyze`, { method: 'POST', body: formData });
  onStageChange?.('classifying');

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Analysis failed. Please try again.'));
  }

  const data = await response.json();
  onStageChange?.('finalizing');
  return transformAnalysisResponse(data);
}

/**
 * Runs the YOLO11s + ResNet50 pipeline (real backend if VITE_API_BASE_URL is
 * set, otherwise the local mock) against an uploaded file.
 */
export async function analyzeImage(file, settings = {}, { onStageChange } = {}) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  if (USE_REAL_API) {
    return realAnalyzeRequest(file, settings, onStageChange);
  }

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
 *
 * Against the real backend this calls POST /history/{id}/rerun, which
 * always reuses the settings the analysis was originally run with —
 * `settingsOverride` only applies in mock mode.
 */
export async function rerunAnalysis(sourceAnalysis, settingsOverride) {
  if (USE_REAL_API) {
    const response = await fetch(`${API_V1}/history/${sourceAnalysis.id}/rerun`, { method: 'POST' });
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Re-running this analysis failed.'));
    }
    return transformAnalysisResponse(await response.json());
  }

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

/**
 * Lets the Analyze page offer ready-made images without a real upload.
 * These always run through the local mock pipeline — the sample images are
 * remote demo assets and fetching their bytes cross-origin to re-upload
 * them for real inference isn't reliable. Hidden entirely when a real
 * backend is configured: a sample-generated result only ever exists in the
 * local mock store, but getHistoryItem()/getHistory() query the real API in
 * that mode, so its Results page would 404 — offering it would be broken,
 * not just redundant.
 */
export function getSampleImages() {
  return USE_REAL_API ? [] : SAMPLE_TEMPLATES;
}

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

/** Real backend equivalent: GET /api/v1/history */
export async function getHistory({ search = '', sort = 'newest' } = {}) {
  if (USE_REAL_API) {
    const params = new URLSearchParams({ page: '1', page_size: '100', sort });
    if (search.trim()) params.set('search', search.trim());

    const response = await fetch(`${API_V1}/history?${params}`);
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Could not load history.'));
    }
    const { items } = await response.json();

    // The list endpoint is intentionally lightweight (no detections array),
    // but History/HistoryDetails render full analyses — fetch each one's
    // full detail in parallel.
    const detailed = await Promise.all(
      items.map(async (item) => {
        const detailResponse = await fetch(`${API_V1}/history/${item.id}`);
        if (!detailResponse.ok) return null;
        return transformAnalysisResponse(await detailResponse.json());
      }),
    );
    return detailed.filter(Boolean);
  }

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

/** Real backend equivalent: GET /api/v1/history/{id} */
export async function getHistoryItem(id) {
  if (USE_REAL_API) {
    const response = await fetch(`${API_V1}/history/${id}`);
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, `No analysis found with id "${id}".`));
    }
    return transformAnalysisResponse(await response.json());
  }

  await delay(220);
  const item = findAnalysis(id);
  if (!item) throw new Error(`No analysis found with id "${id}".`);
  return item;
}

/** Real backend equivalent: DELETE /api/v1/history/{id} */
export async function deleteHistoryItem(id) {
  if (USE_REAL_API) {
    const response = await fetch(`${API_V1}/history/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      throw new Error(await parseErrorMessage(response, 'Delete failed. Please try again.'));
    }
    return { success: true };
  }

  await delay(220);
  removeAnalysis(id);
  return { success: true };
}

/** Real backend equivalent: GET /api/v1/models + GET /api/v1/metrics */
export async function getModelMetrics() {
  if (USE_REAL_API) {
    const [modelsResponse, metricsResponse] = await Promise.all([
      fetch(`${API_V1}/models`),
      fetch(`${API_V1}/metrics`),
    ]);
    if (!modelsResponse.ok || !metricsResponse.ok) {
      throw new Error('Could not load model metrics.');
    }
    const [models, metrics] = await Promise.all([modelsResponse.json(), metricsResponse.json()]);
    return transformModelsAndMetrics(models, metrics);
  }

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
 * result JSON. Real backend equivalent: GET /api/v1/results/{id}/annotated-image
 * (or /original-image) for the image, GET /api/v1/results/{id}/json for the JSON.
 */
export async function downloadResult(analysis, format = 'json') {
  const baseName = analysis.filename.replace(/\.[^.]+$/, '');
  const link = document.createElement('a');

  if (format === 'image') {
    // Cross-origin URLs ignore the `download` attribute and navigate
    // instead, so fetch the bytes first and download from a blob: URL.
    if (/^https?:\/\//i.test(analysis.annotatedImage)) {
      const response = await fetch(analysis.annotatedImage);
      const blob = await response.blob();
      link.href = URL.createObjectURL(blob);
      link.download = `${baseName}_annotated.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      return;
    }
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
