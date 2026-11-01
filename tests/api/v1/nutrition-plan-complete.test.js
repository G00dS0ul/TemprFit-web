import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '@/app/api/v1/nutrition/plan/complete/route.js';
import User from '@/models/User';
import MealPlan from '@/models/MealPlan';
import MealLog from '@/models/MealLog';
import FormCheckSession from '@/models/FormCheckSession';
import { signToken } from '@/lib/auth';
import {
  nutritionProfileUpdateRequestSchema,
  mealPlanSchema,
  mealPlanCompleteRequestSchema,
  mealPlanCompleteResponseSchema,
} from '@/lib/contracts/v1/nutrition';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

function createTestUser(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    name: 'Nutrition Tester',
    email: 'nutrition-tester@temprfit.test',
    role: 'user',
    ...overrides,
  };
}

function authenticate(user) {
  setMockHeaders({
    authorization: `Bearer ${signToken({ userId: user._id })}`,
  });
  mock.method(User, 'findById', async () => user);
}

async function callComplete(body, headers = {}) {
  const reqHeaders = new Headers(headers);
  if (!reqHeaders.has('content-type')) {
    reqHeaders.set('content-type', 'application/json');
  }
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('http://localhost/api/v1/nutrition/plan/complete', {
    method: 'POST',
    headers: reqHeaders,
    body: bodyString,
  });
  return POST(request);
}

describe('POST /api/v1/nutrition/plan/complete and Nutrition/Form-Check Contract Harmonization', () => {
  let user;

  beforeEach(() => {
    clearMockCookies();
    clearMockHeaders();
    user = createTestUser();
  });

  afterEach(() => {
    mock.reset();
  });

  it('returns 401 when no auth is provided', async () => {
    const res = await callComplete({ dayNumber: 1, mealName: 'Oatmeal', completed: true });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Sign in required.');
  });

  it('returns 400 on contract validation failure (dayNumber out of bounds)', async () => {
    authenticate(user);
    const res = await callComplete({ dayNumber: 99, mealName: 'Oatmeal', completed: true });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'Validation failed.');
    assert.ok(data.details);
  });

  it('returns 400 on contract validation failure (missing completed boolean)', async () => {
    authenticate(user);
    const res = await callComplete({ dayNumber: 1, mealName: 'Oatmeal' });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'Validation failed.');
  });

  it('returns 404 when active meal plan is not found', async () => {
    authenticate(user);
    mock.method(MealPlan, 'findOne', async () => null);

    const res = await callComplete({ dayNumber: 1, mealName: 'Oatmeal', completed: true });
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, 'No active meal plan found.');
  });

  it('successfully marks a meal completed', async () => {
    authenticate(user);
    const mockPlan = {
      _id: '507f1f77bcf86cd799439099',
      user: user._id,
      active: true,
      completedMeals: [],
    };
    mock.method(MealPlan, 'findOne', async () => mockPlan);

    let updatedWith = null;
    mock.method(MealPlan, 'updateOne', async (filter, update) => {
      updatedWith = { filter, update };
      return { modifiedCount: 1 };
    });

    const res = await callComplete({ dayNumber: 2, mealName: 'Chicken Salad', completed: true });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(updatedWith);
    assert.ok(updatedWith.update.$addToSet.completedMeals);
    assert.equal(updatedWith.update.$addToSet.completedMeals.dayNumber, 2);
    assert.equal(updatedWith.update.$addToSet.completedMeals.mealName, 'Chicken Salad');
  });

  it('successfully unmarks a completed meal', async () => {
    authenticate(user);
    const mockPlan = {
      _id: '507f1f77bcf86cd799439099',
      user: user._id,
      active: true,
      completedMeals: [{ dayNumber: 2, mealName: 'Chicken Salad' }],
    };
    mock.method(MealPlan, 'findOne', async () => mockPlan);

    let updatedWith = null;
    mock.method(MealPlan, 'updateOne', async (filter, update) => {
      updatedWith = { filter, update };
      return { modifiedCount: 1 };
    });

    const res = await callComplete({ dayNumber: 2, mealName: 'Chicken Salad', completed: false });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(updatedWith.update.$pull.completedMeals);
    assert.equal(updatedWith.update.$pull.completedMeals.dayNumber, 2);
    assert.equal(updatedWith.update.$pull.completedMeals.mealName, 'Chicken Salad');
  });

  describe('Contract Harmonization Validations', () => {
    it('validates extended nutritionProfileUpdateRequestSchema fields', () => {
      const payload = {
        dietaryPattern: 'vegetarian',
        goal: 'gain_muscle',
        calorieTarget: 2500,
        proteinTarget: 150,
        carbsTarget: 300,
        fatTarget: 70,
        location: 'California',
        age: 28,
        budget: 'medium',
        cookingTime: 'quick',
      };
      const parsed = nutritionProfileUpdateRequestSchema.parse(payload);
      assert.equal(parsed.location, 'California');
      assert.equal(parsed.age, 28);
      assert.equal(parsed.budget, 'medium');
      assert.equal(parsed.cookingTime, 'quick');
    });

    it('validates mealPlanSchema with shoppingList alias', () => {
      const planData = {
        user: user._id,
        days: [],
        shoppingList: ['Oats', 'Almond Milk', 'Spinach'],
      };
      const parsed = mealPlanSchema.parse(planData);
      assert.deepEqual(parsed.shoppingList, ['Oats', 'Almond Milk', 'Spinach']);
    });

    it('validates MealLogSchema allows rawFood without food ObjectId', () => {
      const log = new MealLog({
        user: user._id,
        date: new Date(),
        mealType: 'breakfast',
        servings: 1,
        calories: 350,
        protein: 20,
        carbs: 45,
        fat: 10,
        rawFood: {
          name: 'Homemade Smoothie Bowl',
          calories: 350,
          protein: 20,
          carbs: 45,
          fat: 10,
        },
      });
      const err = log.validateSync();
      assert.equal(err, undefined, 'MealLog should validate cleanly with rawFood only');
    });

    it('validates FormCheckSessionSchema allows "other" in exerciseSlug enum', () => {
      const session = new FormCheckSession({
        user: user._id,
        exerciseSlug: 'other',
        videoDurationSeconds: 12.5,
        flaggedIssues: [
          {
            label: 'Knee valgus detected',
            timestampSeconds: 3.2,
            severity: 'warning',
            frameCount: 5,
          },
        ],
      });
      const err = session.validateSync();
      assert.equal(err, undefined, 'FormCheckSession should accept exerciseSlug: "other"');
    });
  });
});
