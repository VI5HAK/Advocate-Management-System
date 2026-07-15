import { z } from "zod";

export const nameSchema = z
  .string({ required_error: "Name is required." })
  .trim()
  .min(1, "Name is required.");

export const addressSchema = z
  .string({ required_error: "Address is required." })
  .trim()
  .min(1, "Address is required.");

export const citySchema = z
  .string({ required_error: "City is required." })
  .trim()
  .min(1, "City is required.");

export const stateSchema = z
  .string({ required_error: "State is required." })
  .trim()
  .min(1, "State is required.");

export const pincodeSchema = z
  .string({ required_error: "Pincode is required." })
  .trim()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits.");

export const contactNumberSchema = z
  .string({ required_error: "Contact number is required." })
  .trim()
  .regex(/^\d{10}$/, "Contact number must be exactly 10 digits.");

export const alternateContactNumberSchema = z
  .string({ required_error: "Alternate contact number must be exactly 10 digits." })
  .trim()
  .regex(/^\d{10}$/, "Alternate contact number must be exactly 10 digits.");

export const emailSchema = z
  .string({ required_error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .email("Invalid email format.");

export const panSchema = z
  .string({ required_error: "PAN number is required." })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN number must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F).");

export const aadhaarSchema = z
  .string({ required_error: "Aadhaar number is required." })
  .trim()
  .regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits.");

export const gstSchema = z
  .string({ required_error: "GST number is required." })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{15}$/, "GST number must be exactly 15 alphanumeric characters.");
