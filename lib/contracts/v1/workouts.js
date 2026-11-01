import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/workouts',
  version: '1.0.0',
  description: 'Workout template management and generation contracts for /api/v1/workouts/**',
};

export const setPlanSchema = z.object({
  targetReps: z.string().optional().default(''),
  targetWeight: z.number().optional().default(0),
  restSeconds: z.number().int().optional().default(60),
  tempo: z.string().optional().default(''),
}).passthrough();

export const workoutExerciseSchema = z.object({
  exercise: z.any(), // ObjectId string or populated exercise object
  order: z.number().int().optional().default(0),
  sets: z.array(setPlanSchema).optional().default([]),
  notes: z.string().optional().default(''),
  name: z.string().optional(),
  slug: z.string().optional(),
  targetMuscles: z.any().optional(),
  alternatives: z.array(z.any()).optional().default([]),
}).passthrough();

export const workoutTemplateSchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  user: z.any(),
  name: z.string(),
  goal: z.string().optional().default(''),
  exercises: z.array(workoutExerciseSchema).default([]),
  source: z.enum(['manual', 'generated']).default('manual'),
  isFavorite: z.boolean().optional().default(false),
  note: z.string().optional().default(''),
  generatorInputs: z.record(z.any()).nullable().optional(),
  lastCompletedAt: z.union([z.string(), z.date()]).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const workoutListResponseSchema = z.object({
  items: z.array(workoutTemplateSchema),
}).passthrough();

export const workoutCreateRequestSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  goal: z.string().optional().default(''),
  exercises: z.array(z.object({
    exercise: z.string().min(1, 'Exercise ID is required'),
    order: z.number().int().optional().default(0),
    sets: z.array(z.object({
      targetReps: z.string().optional().default(''),
      targetWeight: z.number().optional().default(0),
      restSeconds: z.number().int().optional().default(60),
      tempo: z.string().optional().default(''),
    })).optional().default([]),
    notes: z.string().optional().default(''),
  })).min(1, 'Add at least one exercise'),
  note: z.string().optional().default(''),
}).strict();

export const workoutUpdateRequestSchema = workoutCreateRequestSchema.partial().strict();

export const workoutSingleResponseSchema = z.object({
  template: workoutTemplateSchema,
}).passthrough();

export const EQUIPMENT_IMAGE_LIMITS = {
  maxImages: 4,
  maxBytesPerImage: 524288, // 512 KB decoded
  maxTotalBytes: 2097152, // 2 MB decoded aggregate
  maxBodyBytes: 4194304, // 4 MB raw request body
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export const equipmentImageSchema = z.string()
  .describe('Base64 data URL for JPEG, PNG, or WebP equipment photo');

/**
 * Verifies magic number signatures for JPEG, PNG, and WebP.
 * Note: Does not claim full pixel decoding.
 *
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {boolean}
 */
export function verifyImageSignature(buffer, mimeType) {
  if (!buffer || buffer.length < 3) return false;

  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    if (buffer.length < 8) return false;
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

/**
 * Validates equipmentImages against count, canonical base64, mime types,
 * decoded byte limits, and magic signatures.
 * Returns normalized { dataUrl, type } objects for askGemini.
 *
 * @param {string[]} [equipmentImages]
 * @returns {{ valid: boolean, error?: string, normalized?: Array<{ dataUrl: string, type: string }> }}
 */
export function validateAndNormalizeEquipmentImages(equipmentImages) {
  if (!equipmentImages) {
    return { valid: true, normalized: [] };
  }

  if (!Array.isArray(equipmentImages)) {
    return { valid: false, error: 'Equipment images must be an array of base64 data URLs.' };
  }

  if (equipmentImages.length > EQUIPMENT_IMAGE_LIMITS.maxImages) {
    return {
      valid: false,
      error: `At most ${EQUIPMENT_IMAGE_LIMITS.maxImages} equipment images are allowed. Received ${equipmentImages.length}.`,
    };
  }

  let totalDecodedBytes = 0;
  const normalized = [];

  for (let i = 0; i < equipmentImages.length; i++) {
    const item = equipmentImages[i];
    if (typeof item !== 'string' || !item.trim()) {
      return { valid: false, error: `Image at index ${i} is empty or not a string.` };
    }

    const match = item.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (!match) {
      return {
        valid: false,
        error: `Image at index ${i} must be a valid JPEG, PNG, or WebP base64 data URL.`,
      };
    }

    const mimeType = match[1];
    const base64Data = match[3];

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data) || base64Data.length % 4 !== 0) {
      return { valid: false, error: `Image at index ${i} has invalid base64 encoding.` };
    }

    let buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      return { valid: false, error: `Image at index ${i} failed base64 decoding.` };
    }

    if (buffer.length === 0) {
      return { valid: false, error: `Image at index ${i} contains 0 decoded bytes.` };
    }

    if (buffer.toString('base64') !== base64Data) {
      return { valid: false, error: `Image at index ${i} is not canonically base64-encoded.` };
    }

    if (buffer.length > EQUIPMENT_IMAGE_LIMITS.maxBytesPerImage) {
      return {
        valid: false,
        error: `Image at index ${i} exceeds maximum decoded size of ${EQUIPMENT_IMAGE_LIMITS.maxBytesPerImage} bytes (${buffer.length} bytes).`,
      };
    }

    totalDecodedBytes += buffer.length;
    if (totalDecodedBytes > EQUIPMENT_IMAGE_LIMITS.maxTotalBytes) {
      return {
        valid: false,
        error: `Total decoded images size exceeds maximum of ${EQUIPMENT_IMAGE_LIMITS.maxTotalBytes} bytes (${totalDecodedBytes} bytes).`,
      };
    }

    if (!verifyImageSignature(buffer, mimeType)) {
      return {
        valid: false,
        error: `Image at index ${i} file signature does not match declared MIME type ${mimeType}.`,
      };
    }

    normalized.push({
      dataUrl: item,
      type: mimeType,
    });
  }

  return { valid: true, normalized };
}

export const workoutGenerateRequestSchema = z.object({
  timeMinutes: z.coerce.number().min(10).max(180).default(45),
  equipment: z.array(z.string()).optional(),
  muscles: z.array(z.string()).optional(),
  goal: z.string().default('hypertrophy'),
  useAI: z.boolean().default(false),
  notes: z.string().optional().default(''),
  customEquipment: z.array(z.string()).optional(),
  equipmentImages: z.array(equipmentImageSchema).max(EQUIPMENT_IMAGE_LIMITS.maxImages, `At most ${EQUIPMENT_IMAGE_LIMITS.maxImages} equipment images are allowed.`).optional(),
}).strict();

export const workoutGenerateResponseSchema = z.object({
  name: z.string(),
  goal: z.string(),
  generatorInputs: z.record(z.any()),
  generatedBy: z.enum(['rules', 'ai']),
  aiReasoning: z.string().nullable().optional(),
  aiFallbackReason: z.string().nullable().optional(),
  exercises: z.array(workoutExerciseSchema),
}).passthrough();

export const workoutGenerateContract = {
  contractMetadata: {
    endpoint: '/api/v1/workouts/generate',
    method: 'POST',
    version: '1.0.0',
    description: 'Workout template generation using rules or Gemini vision with equipment photos',
  },
  requestSchema: workoutGenerateRequestSchema,
  responseSchema: workoutGenerateResponseSchema,
};
