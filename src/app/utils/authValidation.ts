export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { id: 'number', label: 'One number', met: /\d/.test(password) },
    { id: 'symbol', label: 'One symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function getPasswordStrength(password: string) {
  return getPasswordRequirements(password).filter((requirement) => requirement.met).length;
}

export function isStrongPassword(password: string) {
  return getPasswordRequirements(password).every((requirement) => requirement.met);
}

export function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
