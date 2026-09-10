export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateBMI(weight, height) {
  return parseFloat((weight / (height * height)).toFixed(1));
}

export function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#f59e0b' };
  if (bmi < 25) return { label: 'Healthy Weight', color: '#22c55e' };
  if (bmi < 30) return { label: 'Overweight', color: '#f97316' };
  return { label: 'Obese', color: '#ef4444' };
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Every screen should show the same thing for "the user's name" — prefer the
// username (current field), fall back to the legacy `name` field for any
// account created before this field existed, then the email's local part.
export function displayName(user) {
  if (!user) return 'there';
  return user.username || user.name || (user.email ? user.email.split('@')[0] : 'there');
}
