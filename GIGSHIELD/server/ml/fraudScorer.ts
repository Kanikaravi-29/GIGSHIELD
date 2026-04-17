import * as tf from '@tensorflow/tfjs';

/**
 * GigShield Fraud Detection - TensorFlow.js ML Model
 *
 * Input Features (6):
 *   [0] isGpsSpoofed      – 0 or 1
 *   [1] isMocked          – 0 or 1 (hardware-level flag)
 *   [2] isCityMismatch    – 0 or 1
 *   [3] incomeRatio       – payout / daily_income  (normalized 0–3)
 *   [4] recentClaimsCount – claims in last 24h     (normalized 0–10)
 *   [5] gpsRiskNorm       – GPS risk score / 100   (0.0 – 1.0)
 *
 * Output: fraud probability (0.0 – 1.0) → scaled to 0–100
 */

let model: tf.Sequential | null = null;

// ─── Synthetic Training Data ─────────────────────────────────────────────────
// Each row: [spoofed, mocked, cityMismatch, incomeRatio, recentClaims, gpsRiskNorm]
// Label: fraud probability (0 = clean, 1 = fraudulent)
const TRAINING_SAMPLES: number[][] = [
  // CLEAN — valid GPS, inside city, normal income, few claims
  [0, 0, 0, 0.8, 0, 0.05],
  [0, 0, 0, 1.0, 0, 0.05],
  [0, 0, 0, 0.9, 1, 0.05],
  [0, 0, 0, 1.1, 0, 0.05],
  [0, 0, 0, 0.7, 0, 0.05],
  [0, 0, 0, 1.0, 2, 0.05],
  [0, 0, 0, 0.85, 1, 0.05],
  [0, 0, 0, 0.95, 0, 0.05],

  // MEDIUM — city mismatch (under review territory)
  [0, 0, 1, 1.0, 0, 0.31],
  [0, 0, 1, 1.2, 1, 0.31],
  [0, 0, 1, 0.9, 0, 0.31],
  [0, 0, 1, 1.1, 2, 0.31],
  [0, 0, 1, 1.0, 3, 0.31],

  // HIGH RISK — spoofed, mocked, or high frequency
  [1, 0, 0, 1.0, 0, 0.71],
  [1, 1, 1, 2.0, 5, 0.71],
  [0, 1, 0, 3.0, 5, 0.71],
  [1, 1, 0, 2.5, 8, 0.71],
  [0, 1, 1, 2.0, 6, 0.71],
  [1, 0, 1, 1.5, 4, 0.71],
  [1, 1, 1, 3.0, 9, 1.00],
  [0, 0, 0, 3.0, 9, 0.71],
  [1, 1, 0, 3.0, 0, 0.80],
  [0, 1, 1, 2.5, 7, 0.80],
];

const TRAINING_LABELS: number[] = [
  // CLEAN
  0.05, 0.05, 0.08, 0.05, 0.05, 0.10, 0.07, 0.05,
  // MEDIUM
  0.40, 0.45, 0.38, 0.42, 0.50,
  // HIGH
  0.80, 0.98, 0.85, 0.95, 0.88, 0.82, 0.99, 0.90, 0.92, 0.94,
];

// ─── Build Model ─────────────────────────────────────────────────────────────
const buildModel = (): tf.Sequential => {
  const m = tf.sequential();

  m.add(tf.layers.dense({
    inputShape: [6],
    units: 16,
    activation: 'relu',
    kernelInitializer: 'glorotUniform',
  }));

  m.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  m.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return m;
};

// ─── Train Once ──────────────────────────────────────────────────────────────
const trainModel = async (): Promise<void> => {
  if (model) return;

  console.log('🤖 GigShield ML: Initializing fraud detection model...');
  model = buildModel();

  const xs = tf.tensor2d(TRAINING_SAMPLES, [TRAINING_SAMPLES.length, 6]);
  const ys = tf.tensor2d(TRAINING_LABELS.map(l => [l]), [TRAINING_LABELS.length, 1]);

  await model.fit(xs, ys, {
    epochs: 150,
    batchSize: 8,
    shuffle: true,
    verbose: 0,
  });

  xs.dispose();
  ys.dispose();

  console.log('✅ GigShield ML: Fraud model trained and ready.');
};

// Warm up immediately on import
trainModel().catch(console.error);

// ─── Public API ──────────────────────────────────────────────────────────────

export const getRiskLabel = (score: number): string => {
  if (score >= 71) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
};

/**
 * Run ML inference. Returns fraud score 0–100.
 */
export const calculateClaimFraudScore = async (
  factors: any,
  hardwareData?: any
): Promise<number> => {

  // Ensure model is ready
  if (!model) await trainModel();

  const isGpsSpoofed   = factors.isSpoofed   ? 1 : 0;
  const isMocked       = (factors.isMocked || hardwareData?.isMocked) ? 1 : 0;
  const isCityMismatch = factors.gpsFlag === 'CITY_MISMATCH' ? 1 : 0;
  const incomeRatio    = Math.min(factors.incomeRatio  || 1.0, 3.0);
  const recentClaims   = Math.min(factors.recentClaimsCount || 0, 10);
  const gpsRiskNorm    = Math.min((factors.riskScore   || 0) / 100, 1.0);

  const inputVector = [isGpsSpoofed, isMocked, isCityMismatch, incomeRatio, recentClaims, gpsRiskNorm];

  const inputTensor = tf.tensor2d([inputVector], [1, 6]);
  const predTensor  = model!.predict(inputTensor) as tf.Tensor;
  const [probability] = await predTensor.data();
  inputTensor.dispose();
  predTensor.dispose();

  // Scale 0–1 → 0–100
  const fraudScore = Math.round(probability * 100);

  console.log(`🤖 ML Fraud Engine: features=[${inputVector.join(', ')}] → prob=${probability.toFixed(4)} → score=${fraudScore} [${getRiskLabel(fraudScore)}]`);

  return fraudScore;
};

/**
 * Compatibility shim — exported but not needed with live model
 */
export const trainFraudModelFromDB = async (dbClaims: any[] = []) => {
  console.log('🤖 ML: Re-training with DB data is not yet implemented. Using built-in synthetic training.');
};

export const loadModel = () => true;
