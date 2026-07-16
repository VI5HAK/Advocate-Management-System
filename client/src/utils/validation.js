import { z } from "zod";

// Regex patterns
const alphaSpaceRegex = /^[A-Z ]+$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;

// Input formatters / Sanitizers
export function digitsOnly(value, maxLength) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!maxLength) return digits;
  return digits.slice(0, maxLength);
}

export function uppercaseAlphaAndSpaces(value, maxLength) {
  const lettersAndSpaces = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, ""); // Allow only A-Z and spaces
  if (!maxLength) return lettersAndSpaces;
  return lettersAndSpaces.slice(0, maxLength);
}

export function uppercaseAlphaNum(value, maxLength) {
  const cleanVal = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // Allow only A-Z and digits
  if (!maxLength) return cleanVal;
  return cleanVal.slice(0, maxLength);
}

// Base Advocate Schema
const baseAdvocateSchema = z.object({
  name: z.string()
    .min(1, "Name is required.")
    .max(49, "Name must be less than 50 characters.")
    .refine((val) => alphaSpaceRegex.test(val), {
      message: "Name must contain only alphabets and spaces (uppercase).",
    }),
  roleId: z.string().min(1, "Role is required."),
  address: z.string()
    .min(1, "Address is required.")
    .max(200, "Address cannot exceed 200 characters."),
  city: z.string()
    .min(1, "City is required.")
    .max(49, "City must be less than 50 characters.")
    .refine((val) => alphaSpaceRegex.test(val), {
      message: "City must contain only alphabets and spaces (uppercase).",
    }),
  state: z.string()
    .min(1, "State is required.")
    .max(49, "State must be less than 50 characters.")
    .refine((val) => alphaSpaceRegex.test(val), {
      message: "State must contain only alphabets and spaces (uppercase).",
    }),
  Pincode: z.string()
    .length(6, "Pincode must be exactly 6 digits."),
  contactNumber: z.string()
    .length(10, "Contact number must be exactly 10 digits."),
  alternateContactNumber: z.string()
    .length(10, "Alternate contact number must be exactly 10 digits."),
  emailId: z.string()
    .min(1, "Email is required.")
    .email("Invalid email format."),
  panNumber: z.string()
    .regex(panRegex, "PAN must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F)."),
  aadhaarNumber: z.string()
    .length(12, "Aadhaar number must be exactly 12 digits."),
});

// Create Advocate Schema (passwords mandatory)
export const createAdvocateSchema = baseAdvocateSchema.extend({
  password: z.string().min(1, "Password is required."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password and confirm password do not match.",
  path: ["confirmPassword"],
});

// Update Advocate Schema (passwords optional, but must match if provided)
export const updateAdvocateSchema = baseAdvocateSchema.extend({
  password: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Password and confirm password do not match.",
  path: ["confirmPassword"],
});
