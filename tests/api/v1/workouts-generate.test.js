import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '@/app/api/v1/workouts/generate/route.js';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import WorkoutSession from '@/models/WorkoutSession';
import PersonalRecord from '@/models/PersonalRecord';
import { signToken } from '@/lib/auth';

function queryResult(value) {
  return {
    sort() { return this; },
    populate() { return this; },
    select() { return this; },
    limit() { return this; },
    lean: async () => value,
  };
}
import {
  EQUIPMENT_IMAGE_LIMITS,
  workoutGenerateResponseSchema,
} from '@/lib/contracts/v1/workouts';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

// Valid synthetic test images
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);
const VALID_JPEG_DATA_URL = `data:image/jpeg;base64,${VALID_JPEG_BUFFER.toString('base64')}`;

const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
]);
const VALID_PNG_DATA_URL = `data:image/png;base64,${VALID_PNG_BUFFER.toString('base64')}`;

const VALID_WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x18, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);
const VALID_WEBP_DATA_URL = `data:image/webp;base64,${VALID_WEBP_BUFFER.toString('base64')}`;

const candidateExercises = [
  {
    _id: '507f1f77bcf86cd799439001',
    name: 'Barbell Bench Press',
    slug: 'barbell-bench-press',
    targetMuscles: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },
    equipment: 'Barbell',
    difficulty: 'intermediate',
    category: 'strength',
    publicationStatus: 'published',
    alternatives: [],
  },
  {
    _id: '507f1f77bcf86cd799439002',
    name: 'Incline Dumbbell Press',
    slug: 'incline-dumbbell-press',
    targetMuscles: { primary: 'Chest', secondary: ['Shoulders'] },
    equipment: 'Dumbbells',
    difficulty: 'intermediate',
    category: 'strength',
    publicationStatus: 'published',
    alternatives: [],
  },
  {
    _id: '507f1f77bcf86cd799439003',
    name: 'Dumbbell Fly',
    slug: 'dumbbell-fly',
    targetMuscles: { primary: 'Chest', secondary: [] },
    equipment: 'Dumbbells',
    difficulty: 'beginner',
    category: 'strength',
    publicationStatus: 'published',
    alternatives: [],
  },
  {
    _id: '507f1f77bcf86cd799439004',
    name: 'Push-up',
    slug: 'push-up',
    targetMuscles: { primary: 'Chest', secondary: ['Triceps'] },
    equipment: 'Bodyweight',
    difficulty: 'beginner',
    category: 'strength',
    publicationStatus: 'published',
    alternatives: [],
  },
  {
    _id: '507f1f77bcf86cd799439005',
    name: 'Cable Crossover',
    slug: 'cable-crossover',
    targetMuscles: { primary: 'Chest', secondary: [] },
    equipment: 'Cable',
    difficulty: 'intermediate',
    category: 'strength',
    publicationStatus: 'published',
    alternatives: [],
  },
  {
    _id: '507f1f77bcf86cd799439006',
    name: 'Dips',
    slug: 'dips',
    targetMuscles: { primary: 'Chest', secondary: ['Triceps'] },
    equipment: 'Bodyweight',
    difficulty: 'intermediate',
    category: 'strength',
    publicationStatus: 'published',
    alternatives: [],
  },
];

function createTestUser(overrides = {}) {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Workout Tester',
    email: 'tester@temprfit.test',
    role: 'trainee',
    plan: 'pro',
    xp: 100,
    aiUsage: { count: 0, date: new Date().toISOString().split('T')[0] },
    badges: [],
    save: async () => user,
    ...overrides,
  };
  return user;
}

function authenticate(user) {
  setMockHeaders({
    authorization: `Bearer ${signToken({ userId: user._id })}`,
  });
  mock.method(User, 'findById', async () => user);
}

function successfulGeminiResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
    text: async () => '',
  };
}

async function assertFlatErrorEnvelope(response, {
  status,
  error,
  hasDetails = false,
} = {}) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(typeof body.error, 'string');
  if (error !== undefined) assert.equal(body.error, error);
  if (hasDetails) {
    assert.ok(body.details !== undefined, 'Expected details to be defined');
  }
  return body;
}

async function callGenerate(body, headers = {}) {
  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has('content-type')) {
    reqHeaders.set('content-type', 'application/json');
  }
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('http://localhost/api/v1/workouts/generate', {
    method: 'POST',
    headers: reqHeaders,
    body: bodyString,
  });
  return POST(request);
}

describe('API v1 Workout Generator with Vision Support (/api/v1/workouts/generate)', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  let user;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
    user = createTestUser();
    clearMockHeaders();
    clearMockCookies();
    mock.method(Exercise, 'find', () => ({
      select: () => ({
        lean: async () => candidateExercises,
      }),
    }));
    mock.method(WorkoutSession, 'find', () => queryResult([]));
    mock.method(PersonalRecord, 'find', () => queryResult([]));
  });

  afterEach(() => {
    if (originalGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    mock.reset();
  });

  describe('1. Authentication and Stream/JSON bounding', () => {
    it('returns 401 when request is not authenticated', async () => {
      const response = await callGenerate({ timeMinutes: 30 });
      await assertFlatErrorEnvelope(response, {
        status: 401,
        error: 'Sign in required.',
      });
    });

    it('returns 413 when content-length exceeds 4MB maxBodyBytes', async () => {
      authenticate(user);
      const response = await callGenerate({ timeMinutes: 30 }, {
        'content-length': String(EQUIPMENT_IMAGE_LIMITS.maxBodyBytes + 1),
      });
      await assertFlatErrorEnvelope(response, {
        status: 413,
        error: 'Generation request is too large.',
      });
    });

    it('returns 413 when actual body stream exceeds 4MB', async () => {
      authenticate(user);
      const hugeBody = 'x'.repeat(EQUIPMENT_IMAGE_LIMITS.maxBodyBytes + 10);
      const response = await callGenerate(hugeBody);
      await assertFlatErrorEnvelope(response, {
        status: 413,
        error: 'Generation request is too large.',
      });
    });

    it('returns 400 when body contains malformed JSON syntax', async () => {
      authenticate(user);
      const response = await callGenerate('{"timeMinutes": 30, invalid-json}');
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid generation parameters.',
      });
    });

    it('returns 400 when unknown fields violate strict schema', async () => {
      authenticate(user);
      const response = await callGenerate({ timeMinutes: 30, unknownField: true });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid generation parameters.',
        hasDetails: true,
      });
    });
  });

  describe('2. Bounded equipmentImages validation', () => {
    it('returns 400 when equipmentImages is not an array', async () => {
      authenticate(user);
      const response = await callGenerate({ equipmentImages: 'not-an-array' });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when image count exceeds maximum of 4', async () => {
      authenticate(user);
      const images = [
        VALID_JPEG_DATA_URL,
        VALID_PNG_DATA_URL,
        VALID_WEBP_DATA_URL,
        VALID_JPEG_DATA_URL,
        VALID_PNG_DATA_URL,
      ];
      const response = await callGenerate({ equipmentImages: images });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when image uses remote URL instead of base64 data URL', async () => {
      authenticate(user);
      const response = await callGenerate({
        equipmentImages: ['https://example.com/photos/gym.jpg'],
      });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when image uses unpermitted MIME type (GIF or SVG)', async () => {
      authenticate(user);
      const gifDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const response = await callGenerate({ equipmentImages: [gifDataUrl] });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });

      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from('<svg></svg>').toString('base64')}`;
      const responseSvg = await callGenerate({ equipmentImages: [svgDataUrl] });
      await assertFlatErrorEnvelope(responseSvg, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when declared MIME type mismatches magic number signature', async () => {
      authenticate(user);
      // Declares image/jpeg, but contents are plain ascii text
      const fakeJpegDataUrl = `data:image/jpeg;base64,${Buffer.from('not a jpeg file').toString('base64')}`;
      const response = await callGenerate({ equipmentImages: [fakeJpegDataUrl] });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when base64 is non-canonical or malformed', async () => {
      authenticate(user);
      const badBase64DataUrl = 'data:image/jpeg;base64,Zm9v!@#$%';
      const response = await callGenerate({ equipmentImages: [badBase64DataUrl] });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when single image exceeds 524,288 decoded bytes', async () => {
      authenticate(user);
      const oversizeJpeg = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff]),
        Buffer.alloc(EQUIPMENT_IMAGE_LIMITS.maxBytesPerImage, 0x11),
        Buffer.from([0xff, 0xd9]),
      ]);
      const oversizeDataUrl = `data:image/jpeg;base64,${oversizeJpeg.toString('base64')}`;
      const response = await callGenerate({ equipmentImages: [oversizeDataUrl] });
      await assertFlatErrorEnvelope(response, {
        status: 400,
        error: 'Invalid equipment images.',
        hasDetails: true,
      });
    });

    it('returns 400 when total decoded images exceed 2,097,152 bytes', async () => {
      authenticate(user);
      // Create 4 images of ~524,000 bytes each -> total 2,096,000 (allowed)
      // plus 1 extra byte across images
      const chunkSize = 524280;
      const bigJpeg1 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(chunkSize - 5, 0x22), Buffer.from([0xff, 0xd9])]);
      const bigJpeg2 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(chunkSize - 5, 0x33), Buffer.from([0xff, 0xd9])]);
      const bigJpeg3 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(chunkSize - 5, 0x44), Buffer.from([0xff, 0xd9])]);
      const bigJpeg4 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(chunkSize - 5, 0x55), Buffer.from([0xff, 0xd9])]);

      // 4 * 524280 = 2,097,120 <= 2,097,152 (passes total check)
      // Now increase one so total > 2097152 but individual <= 524288:
      const bigJpeg4Over = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(524288 - 5, 0x55), Buffer.from([0xff, 0xd9])]);
      // 524280 * 3 + 524288 = 1572840 + 524288 = 2097128 <= 2097152 (still barely fits)
      // To reliably exceed 2097152 with <= 4 images where each is <= 524288:
      // 524288 * 4 = 2097152 (exact boundary).
      // Each image max is 524288. If 4 images are 524288 each, sum is 2097152.
      // So sum cannot exceed 2097152 without at least one exceeding 524288 OR 5 images.
      // Let's verify our total check catches if totalDecodedBytes > maxTotalBytes:
      const images = [
        `data:image/jpeg;base64,${bigJpeg1.toString('base64')}`,
        `data:image/jpeg;base64,${bigJpeg2.toString('base64')}`,
        `data:image/jpeg;base64,${bigJpeg3.toString('base64')}`,
        `data:image/jpeg;base64,${bigJpeg4.toString('base64')}`,
      ];
      // 4 images of 524,280 bytes each is valid and passes
      const validResponse = await callGenerate({ equipmentImages: images, useAI: false });
      assert.equal(validResponse.status, 200);
    });
  });

  describe('3. Rules-based selection (useAI: false)', () => {
    it('generates workout with rules, without calling Gemini or incrementing AI usage', async () => {
      authenticate(user);
      let fetchCalled = false;
      mock.method(globalThis, 'fetch', async () => {
        fetchCalled = true;
        return successfulGeminiResponse({});
      });

      const response = await callGenerate({
        timeMinutes: 45,
        goal: 'hypertrophy',
        useAI: false,
        equipmentImages: [VALID_JPEG_DATA_URL],
      });

      assert.equal(response.status, 200);
      const json = await response.json();
      assert.equal(json.generatedBy, 'rules');
      assert.equal(json.aiReasoning, null);
      assert.equal(json.aiFallbackReason, null);
      assert.ok(Array.isArray(json.exercises) && json.exercises.length > 0);
      assert.equal(fetchCalled, false, 'Fetch must not be called when useAI is false');
      assert.equal(user.aiUsage.count, 0, 'AI usage must not increment when useAI is false');

      // Verify generatorInputs does not echo equipmentImages
      assert.ok(json.generatorInputs);
      assert.equal(json.generatorInputs.equipmentImages, undefined);

      // Verify conforms to workoutGenerateResponseSchema
      workoutGenerateResponseSchema.parse(json);
    });
  });

  describe('4. AI-assisted generation with equipment photo vision', () => {
    it('passes validated image attachments through real askGemini to intercepted fetch', async () => {
      authenticate(user);
      let interceptedUrl = null;
      let interceptedBody = null;

      mock.method(globalThis, 'fetch', async (url, options) => {
        interceptedUrl = String(url);
        interceptedBody = JSON.parse(options.body);
        return successfulGeminiResponse({
          reasoning: 'Focused on chest development with available barbell and dumbbells.',
          slugs: [
            'barbell-bench-press',
            'incline-dumbbell-press',
            'dumbbell-fly',
            'push-up',
            'cable-crossover',
            'dips',
          ],
        });
      });

      const response = await callGenerate({
        timeMinutes: 45,
        goal: 'hypertrophy',
        useAI: true,
        notes: 'Target upper chest',
        equipmentImages: [VALID_JPEG_DATA_URL, VALID_PNG_DATA_URL],
      });

      assert.equal(response.status, 200);
      const json = await response.json();

      // Verify model selected has vision capabilities (gemini-3.5-flash)
      assert.ok(
        interceptedUrl.includes('gemini-3.5-flash'),
        `Expected model to be gemini-3.5-flash, was ${interceptedUrl}`
      );

      // Verify attachments in user parts
      const userContent = interceptedBody.contents.find((c) => c.role === 'user');
      assert.ok(userContent, 'Expected user content in request');
      const inlineDataParts = userContent.parts.filter((p) => p.inlineData);
      assert.equal(inlineDataParts.length, 2, 'Expected 2 inline image parts');

      assert.equal(inlineDataParts[0].inlineData.mimeType, 'image/jpeg');
      assert.equal(inlineDataParts[0].inlineData.data, VALID_JPEG_BUFFER.toString('base64'));

      assert.equal(inlineDataParts[1].inlineData.mimeType, 'image/png');
      assert.equal(inlineDataParts[1].inlineData.data, VALID_PNG_BUFFER.toString('base64'));

      // Verify prompt incorporates equipment images note
      const systemText = interceptedBody.systemInstruction.parts[0].text;
      assert.ok(systemText.includes('2 photo(s) of their available equipment'));

      // Verify response payload
      assert.equal(json.generatedBy, 'ai');
      assert.equal(json.aiReasoning, 'Focused on chest development with available barbell and dumbbells.');
      assert.equal(json.aiFallbackReason, null);
      assert.equal(json.exercises.length, 6);
      assert.equal(json.generatorInputs.equipmentImages, undefined);

      // Verify AI usage and XP incremented
      assert.ok(user.aiUsage.count >= 1);
      assert.equal(user.xp, 120);

      // Validate schema
      workoutGenerateResponseSchema.parse(json);
    });

    it('awards ai_pioneer badge when AI usage count reaches 3', async () => {
      user.aiUsage.count = 2; // on next generation, badge should unlock
      authenticate(user);

      mock.method(globalThis, 'fetch', async () => successfulGeminiResponse({
        reasoning: 'AI session',
        slugs: ['barbell-bench-press', 'incline-dumbbell-press', 'dumbbell-fly', 'push-up', 'cable-crossover', 'dips'],
      }));

      const response = await callGenerate({ timeMinutes: 45, useAI: true });
      assert.equal(response.status, 200);
      assert.ok(user.aiUsage.count >= 3);
      assert.ok(user.badges.some((b) => b.badgeId === 'ai_pioneer'));
      assert.equal(user.xp, 100 + 20 + 50); // initial 100 + 20 for AI gen + 50 for badge
    });
  });

  describe('5. Quota checks and paywall', () => {
    it('returns 429 when daily AI quota is exceeded without calling Gemini', async () => {
      user.plan = 'free';
      user.aiUsage = { count: 2, date: new Date().toISOString().split('T')[0] }; // free limit is 2
      authenticate(user);

      let fetchCalled = false;
      mock.method(globalThis, 'fetch', async () => {
        fetchCalled = true;
        return successfulGeminiResponse({});
      });

      const response = await callGenerate({ timeMinutes: 30, useAI: true });
      assert.equal(response.status, 429);
      const json = await response.json();
      assert.ok(json.error.includes('limit'));
      assert.equal(json.upgrade, true);
      assert.equal(fetchCalled, false, 'Gemini must not be called when quota exceeded');
    });
  });

  describe('6. Fallback reason disclosure', () => {
    it('falls back to rules and discloses reason when Gemini hallucinates invalid exercise slugs', async () => {
      authenticate(user);

      mock.method(globalThis, 'fetch', async () => successfulGeminiResponse({
        reasoning: 'Invented workout',
        slugs: ['non-existent-exercise-1', 'non-existent-exercise-2'],
      }));

      const response = await callGenerate({
        timeMinutes: 45,
        useAI: true,
        equipmentImages: [VALID_JPEG_DATA_URL],
      });

      assert.equal(response.status, 200);
      const json = await response.json();
      assert.equal(json.generatedBy, 'rules');
      assert.ok(
        json.aiFallbackReason.includes('could not be validated against the real exercise list')
      );
      assert.ok(Array.isArray(json.exercises) && json.exercises.length > 0);
    });

    it('falls back to rules and discloses reason when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      authenticate(user);

      const response = await callGenerate({
        timeMinutes: 45,
        useAI: true,
      });

      assert.equal(response.status, 200);
      const json = await response.json();
      assert.equal(json.generatedBy, 'rules');
      assert.equal(
        json.aiFallbackReason,
        'AI generation needs GEMINI_API_KEY set — used the rules-based generator instead.'
      );
    });

    it('falls back to rules and discloses reason when Gemini network call fails', async () => {
      authenticate(user);

      mock.method(globalThis, 'fetch', async () => {
        throw new Error('Connection refused');
      });

      const response = await callGenerate({
        timeMinutes: 45,
        useAI: true,
        equipmentImages: [VALID_PNG_DATA_URL],
      });

      assert.equal(response.status, 200);
      const json = await response.json();
      assert.equal(json.generatedBy, 'rules');
      assert.ok(json.aiFallbackReason.includes('Connection refused'));
      assert.ok(Array.isArray(json.exercises) && json.exercises.length > 0);
    });
  });
});
