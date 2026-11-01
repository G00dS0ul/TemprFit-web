import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '@/app/api/v1/exercises/swap/route.js';
import User from '@/models/User';
import Exercise from '@/models/Exercise';
import { signToken } from '@/lib/auth';
import { exerciseSwapResponseSchema } from '@/lib/contracts/v1/exercises';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

function createTestUser(overrides = {}) {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Swap Tester',
    email: 'swap-tester@temprfit.test',
    role: 'trainee',
    plan: 'free',
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

async function callSwap(body, headers = {}) {
  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has('content-type')) {
    reqHeaders.set('content-type', 'application/json');
  }
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('http://localhost/api/v1/exercises/swap', {
    method: 'POST',
    headers: reqHeaders,
    body: bodyString,
  });
  return POST(request);
}

async function assertFlatError(response, { status, error, hasDetails = false } = {}) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(typeof body.error, 'string');
  if (error !== undefined) {
    assert.equal(body.error, error);
  }
  assert.deepEqual(
    Object.keys(body).sort(),
    hasDetails ? ['details', 'error'] : ['error']
  );
  return body;
}

function mockGeminiSuccess(candidatesArray) {
  const text = typeof candidatesArray === 'string' ? candidatesArray : JSON.stringify(candidatesArray);
  mock.method(globalThis, 'fetch', async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
      text: async () => '',
    };
  });
}

describe('API v1 Exercise Swap (/api/v1/exercises/swap)', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  let user;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
    user = createTestUser();
    clearMockHeaders();
    clearMockCookies();
  });

  afterEach(() => {
    if (originalGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    mock.reset();
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 Sign in required when unauthenticated', async () => {
      const response = await callSwap({ exerciseName: 'Barbell Bench Press' });
      await assertFlatError(response, {
        status: 401,
        error: 'Sign in required',
        hasDetails: false,
      });
    });

    it('returns 401 Sign in required when token is invalid', async () => {
      setMockHeaders({ authorization: 'Bearer invalid.token.payload' });
      const response = await callSwap({ exerciseName: 'Barbell Bench Press' });
      await assertFlatError(response, {
        status: 401,
        error: 'Sign in required',
        hasDetails: false,
      });
    });

    it('authenticates with valid Bearer token and proceeds', async () => {
      authenticate(user);
      mockGeminiSuccess([
        { name: 'Dumbbell Press', reason: 'Targets same chest muscles.' },
      ]);
      mock.method(Exercise, 'find', () => ({
        select: () => ({
          lean: async () => [
            {
              _id: '507f1f77bcf86cd799439001',
              name: 'Dumbbell Press',
              slug: 'dumbbell-press',
              publicationStatus: 'published',
            },
          ],
        }),
      }));

      const response = await callSwap({ exerciseName: 'Barbell Bench Press' });
      assert.equal(response.status, 200);
      const json = await response.json();
      assert.equal(json.success, true);
      assert.equal(json.alternatives.length, 1);
    });
  });

  describe('Request Parameter Validation (400)', () => {
    beforeEach(() => {
      authenticate(user);
    });

    it('returns 400 when body is missing or invalid JSON', async () => {
      const request = new Request('http://localhost/api/v1/exercises/swap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid-json{',
      });
      const response = await POST(request);
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when exerciseName is omitted', async () => {
      const response = await callSwap({});
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when exerciseName is empty string or only whitespace', async () => {
      const response = await callSwap({ exerciseName: '   ' });
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when exerciseName exceeds 200 characters', async () => {
      const longName = 'A'.repeat(201);
      const response = await callSwap({ exerciseName: longName });
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when unknown keys are included (strict schema)', async () => {
      const response = await callSwap({
        exerciseName: 'Push-up',
        unexpectedField: 'not allowed',
      });
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when currentEquipment is wrong type (number or boolean)', async () => {
      const response = await callSwap({
        exerciseName: 'Push-up',
        currentEquipment: 12345,
      });
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when currentEquipment is null', async () => {
      const response = await callSwap({
        exerciseName: 'Push-up',
        currentEquipment: null,
      });
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });

    it('returns 400 when currentEquipment exceeds 1000 characters', async () => {
      const longEquipment = 'Dumbbells, '.repeat(101);
      const response = await callSwap({
        exerciseName: 'Push-up',
        currentEquipment: longEquipment,
      });
      await assertFlatError(response, {
        status: 400,
        error: 'Invalid exercise swap parameters',
        hasDetails: true,
      });
    });
  });

  describe('AI Generation Failure & Robustness (500)', () => {
    beforeEach(() => {
      authenticate(user);
    });

    it('returns 500 when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });

    it('returns 500 when Gemini network call throws', async () => {
      mock.method(globalThis, 'fetch', async () => {
        throw new Error('Connection reset by peer');
      });
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });

    it('returns 500 when Gemini returns HTTP error status', async () => {
      mock.method(globalThis, 'fetch', async () => {
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal AI error',
        };
      });
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });

    it('returns 500 when Gemini returns invalid non-JSON text', async () => {
      mockGeminiSuccess('Sorry, as an AI I cannot help with this.');
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });

    it('returns 500 when Gemini returns more than 3 alternatives', async () => {
      mockGeminiSuccess([
        { name: 'Alt 1', reason: 'R1' },
        { name: 'Alt 2', reason: 'R2' },
        { name: 'Alt 3', reason: 'R3' },
        { name: 'Alt 4', reason: 'R4' },
      ]);
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });

    it('returns 500 when candidate item is missing name or reason', async () => {
      mockGeminiSuccess([
        { name: 'Alt 1' }, // missing reason
      ]);
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });

    it('returns 500 when candidate item name exceeds 200 chars', async () => {
      mockGeminiSuccess([
        { name: 'X'.repeat(201), reason: 'Valid reason' },
      ]);
      const response = await callSwap({ exerciseName: 'Push-up' });
      await assertFlatError(response, {
        status: 500,
        error: 'Failed to generate alternatives',
        hasDetails: false,
      });
    });
  });

  describe('Database Matching & Exact DTO Construction', () => {
    beforeEach(() => {
      authenticate(user);
    });

    it('populates _id and slug for exact case-insensitive published match', async () => {
      mockGeminiSuccess([
        { name: 'dumbbell floor press', reason: 'Similar horizontal pressing pattern' },
      ]);

      let capturedFilter = null;
      mock.method(Exercise, 'find', (filter) => {
        capturedFilter = filter;
        return {
          select: () => ({
            lean: async () => [
              {
                _id: '507f1f77bcf86cd799439001',
                name: 'Dumbbell Floor Press',
                slug: 'dumbbell-floor-press',
                publicationStatus: 'published',
              },
            ],
          }),
        };
      });

      const response = await callSwap({ exerciseName: 'Push-up' });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(capturedFilter.publicationStatus, 'published');
      assert.deepEqual(json, {
        success: true,
        alternatives: [
          {
            name: 'dumbbell floor press',
            reason: 'Similar horizontal pressing pattern',
            _id: '507f1f77bcf86cd799439001',
            slug: 'dumbbell-floor-press',
          },
        ],
      });
      exerciseSwapResponseSchema.parse(json);
    });

    it('sets _id and slug to null for unmatched exercise while preserving name and reason', async () => {
      mockGeminiSuccess([
        { name: 'Bespoke Custom Movement', reason: 'Unlisted movement suggestion' },
      ]);

      mock.method(Exercise, 'find', () => ({
        select: () => ({
          lean: async () => [],
        }),
      }));

      const response = await callSwap({ exerciseName: 'Push-up' });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.deepEqual(json, {
        success: true,
        alternatives: [
          {
            name: 'Bespoke Custom Movement',
            reason: 'Unlisted movement suggestion',
            _id: null,
            slug: null,
          },
        ],
      });
      exerciseSwapResponseSchema.parse(json);
    });

    it('sets _id and slug to null when exercise is draft or archived (not published)', async () => {
      mockGeminiSuccess([
        { name: 'Draft Exercise', reason: 'Work in progress in catalog' },
      ]);

      // DB query filter enforces publicationStatus: 'published', so draft is not returned
      mock.method(Exercise, 'find', (filter) => {
        assert.equal(filter.publicationStatus, 'published');
        return {
          select: () => ({
            lean: async () => [], // Not returned because it's draft
          }),
        };
      });

      const response = await callSwap({ exerciseName: 'Push-up' });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.alternatives[0]._id, null);
      assert.equal(json.alternatives[0].slug, null);
      assert.equal(json.alternatives[0].name, 'Draft Exercise');
      exerciseSwapResponseSchema.parse(json);
    });

    it('escapes regex metacharacters in exercise names literally without failure', async () => {
      const specialName = 'Push-Up (Deficit) + Band [Hard]';
      mockGeminiSuccess([
        { name: specialName, reason: 'Increased range of motion with resistance' },
      ]);

      let capturedFilter = null;
      mock.method(Exercise, 'find', (filter) => {
        capturedFilter = filter;
        return {
          select: () => ({
            lean: async () => [
              {
                _id: '507f1f77bcf86cd799439099',
                name: specialName,
                slug: 'push-up-deficit-band-hard',
                publicationStatus: 'published',
              },
            ],
          }),
        };
      });

      const response = await callSwap({ exerciseName: 'Push-up' });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.ok(capturedFilter.name.$in[0] instanceof RegExp);
      // Literal match succeeds and receives IDs
      assert.equal(json.alternatives[0]._id, '507f1f77bcf86cd799439099');
      assert.equal(json.alternatives[0].slug, 'push-up-deficit-band-hard');
      exerciseSwapResponseSchema.parse(json);
    });

    it('preserves order of multiple mixed matched and unlisted alternatives', async () => {
      mockGeminiSuccess([
        { name: 'Exercise One', reason: 'Reason 1' },
        { name: 'Exercise Two', reason: 'Reason 2' },
        { name: 'Exercise Three', reason: 'Reason 3' },
      ]);

      mock.method(Exercise, 'find', () => ({
        select: () => ({
          lean: async () => [
            // Exercise Two returned first from DB query
            {
              _id: '507f1f77bcf86cd799439002',
              name: 'Exercise Two',
              slug: 'exercise-two',
              publicationStatus: 'published',
            },
            // Exercise One returned second from DB query
            {
              _id: '507f1f77bcf86cd799439001',
              name: 'Exercise One',
              slug: 'exercise-one',
              publicationStatus: 'published',
            },
            // Exercise Three is unlisted / not in DB
          ],
        }),
      }));

      const response = await callSwap({ exerciseName: 'Base Exercise' });
      assert.equal(response.status, 200);
      const json = await response.json();

      assert.equal(json.alternatives.length, 3);
      // Retains original AI candidate order
      assert.equal(json.alternatives[0].name, 'Exercise One');
      assert.equal(json.alternatives[0]._id, '507f1f77bcf86cd799439001');

      assert.equal(json.alternatives[1].name, 'Exercise Two');
      assert.equal(json.alternatives[1]._id, '507f1f77bcf86cd799439002');

      assert.equal(json.alternatives[2].name, 'Exercise Three');
      assert.equal(json.alternatives[2]._id, null);
      assert.equal(json.alternatives[2].slug, null);

      exerciseSwapResponseSchema.parse(json);
    });

    it('returns empty alternatives array if model returned empty array', async () => {
      mockGeminiSuccess([]);
      mock.method(Exercise, 'find', () => ({
        select: () => ({
          lean: async () => [],
        }),
      }));

      const response = await callSwap({ exerciseName: 'Obscure Exercise' });
      assert.equal(response.status, 200);
      const json = await response.json();
      assert.deepEqual(json, { success: true, alternatives: [] });
      exerciseSwapResponseSchema.parse(json);
    });
  });

  describe('Equipment Prompt Behavior', () => {
    beforeEach(() => {
      authenticate(user);
    });

    it('defaults equipment to Bodyweight, Dumbbells, Bands when omitted', async () => {
      let capturedBody = null;
      mock.method(globalThis, 'fetch', async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '[]' }] } }],
          }),
          text: async () => '',
        };
      });

      mock.method(Exercise, 'find', () => ({
        select: () => ({ lean: async () => [] }),
      }));

      const response = await callSwap({ exerciseName: 'Pull-up' });
      assert.equal(response.status, 200);

      const promptText = capturedBody.systemInstruction.parts[0].text;
      assert.ok(promptText.includes('Bodyweight, Dumbbells, Bands'));
    });

    it('defaults equipment to Bodyweight, Dumbbells, Bands when empty string', async () => {
      let capturedBody = null;
      mock.method(globalThis, 'fetch', async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '[]' }] } }],
          }),
          text: async () => '',
        };
      });

      mock.method(Exercise, 'find', () => ({
        select: () => ({ lean: async () => [] }),
      }));

      const response = await callSwap({ exerciseName: 'Pull-up', currentEquipment: '   ' });
      assert.equal(response.status, 200);

      const promptText = capturedBody.systemInstruction.parts[0].text;
      assert.ok(promptText.includes('Bodyweight, Dumbbells, Bands'));
    });

    it('passes custom equipment to prompt when supplied', async () => {
      let capturedBody = null;
      mock.method(globalThis, 'fetch', async (url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '[]' }] } }],
          }),
          text: async () => '',
        };
      });

      mock.method(Exercise, 'find', () => ({
        select: () => ({ lean: async () => [] }),
      }));

      const response = await callSwap({
        exerciseName: 'Squat',
        currentEquipment: 'Barbell, Squat Rack',
      });
      assert.equal(response.status, 200);

      const promptText = capturedBody.systemInstruction.parts[0].text;
      assert.ok(promptText.includes('Barbell, Squat Rack'));
    });
  });
});
