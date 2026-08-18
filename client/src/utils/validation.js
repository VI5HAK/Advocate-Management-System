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

export function uppercaseAlphaNumAndSpaces(value, maxLength) {
  const cleanVal = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9 \/\\-]/g, ""); // Allow only A-Z, 0-9, spaces, /, \, and -
  if (!maxLength) return cleanVal;
  return cleanVal.slice(0, maxLength);
}

// Reusable field-level validators
export const requiredText = (field, max = 50) =>
  z.string()
    .trim()
    .min(1, `${field} is required.`)
    .max(max, `${field} must be less than ${max + 1} characters.`);

export const descriptionValidation = (field = "Description", max = 100) =>
  z.string()
    .trim()
    .max(max, `${field} must be less than ${max + 1} characters.`)
    .optional()
    .or(z.literal(""));


export const alphaField = (field, max = 49) =>
  requiredText(field, max).regex(
    alphaSpaceRegex,
    `${field} must contain only alphabets and spaces (uppercase).`
  );

export const alphaNumSpaceField = (field, max = 49) =>
  requiredText(field, max).regex(
    /^[A-Z0-9 \/\\-]+$/,
    `${field} must contain only alphabets, numbers, spaces, and /, \\, - characters (uppercase).`
  );

export const phoneField = (field = "Contact number") =>
  z.string().length(10, `${field} must be exactly 10 digits.`);

export const pincodeField =
  z.string().length(6, "Pincode must be exactly 6 digits.");

export const aadhaarField =
  z.string().length(12, "Aadhaar number must be exactly 12 digits.");

export const emailField =
  z.string()
    .trim()
    .min(1, "Email is required.")
    .email("Invalid email format.");

export const panField =
  z.string().regex(
    panRegex,
    "PAN must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F)."
  );

// Common fields objects
export const addressFields = {
  State_ID: z.union([z.string(), z.number()]).refine((val) => val !== "" && val !== 0 && val !== null && val !== undefined, "State is required."),
  District_ID: z.union([z.string(), z.number()]).refine((val) => val !== "" && val !== 0 && val !== null && val !== undefined, "District is required."),
  Taluk_ID: z.union([z.string(), z.number()]).refine((val) => val !== "" && val !== 0 && val !== null && val !== undefined, "Taluk is required."),
  address: requiredText("Address", 200),
  Pincode: pincodeField,
};

export const contactFields = {
  contactNumber: phoneField(),
  alternateContactNumber: phoneField("Alternate contact number"),
  emailId: emailField,
};

// Base Advocate Schema
const baseAdvocateSchema = z.object({
  name: alphaField("Name"),
  roleId: z.string().min(1, "Role is required."),
  ...addressFields,
  ...contactFields,
  panNumber: panField,
  aadhaarNumber: aadhaarField,
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

// Client Schema definitions
export const clientSchema = z.object({
  name: alphaField("Client name"),
  clientTypeId: z.string().min(1, "Client type is required."),
  ...addressFields,
  contactPerson: requiredText("Contact person name", 50),
  ...contactFields,
  emailId: z.string().trim().email("Invalid email format.").optional().or(z.literal("")),
  panNumber: z.string().trim().regex(panRegex, "PAN must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F).").optional().or(z.literal("")),
  aadhaarNumber: z.string().optional().or(z.literal("")),
  gstNumber: z.string().optional().or(z.literal("")),
});

export const getClientSchema = (showAadhaar) => {
  return clientSchema.superRefine((data, ctx) => {
    if (showAadhaar) {
      if (data.aadhaarNumber && data.aadhaarNumber.trim() !== "") {
        if (data.aadhaarNumber.length !== 12) {
          ctx.addIssue({
            code: "custom",
            message: "Aadhaar number must be exactly 12 digits.",
            path: ["aadhaarNumber"],
          });
        }
      }
    } else {
      if (data.gstNumber && data.gstNumber.trim() !== "") {
        const gstRegex = /^[A-Z0-9]{15}$/;
        if (!gstRegex.test(data.gstNumber.trim().toUpperCase())) {
          ctx.addIssue({
            code: "custom",
            message: "GST number must be exactly 15 alphanumeric characters.",
            path: ["gstNumber"],
          });
        }
      }
    }
  });
};

// Case Schema definition
export const caseSchema = z.object({
  clientIds: z.array(z.number()).min(1, "At least one client must be selected."),
  caseNumber: requiredText("Case number"),
  caseTypeId: z.string().min(1, "Case type is required."),
  courtId: z.string().min(1, "Court name is required."),
  petitioner: alphaField("Petitioner"),
  petitionerAdvocate: alphaField("Petitioner advocate"),
  respondent: alphaField("Respondent"),
  respondentAdvocate: alphaField("Respondent advocate"),
  filingDate: z.string()
    .min(1, "Filing date is required.")
    .refine((val) => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const localToday = `${year}-${month}-${day}`;
      return val <= localToday;
    }, {
      message: "Filing date cannot be in the future.",
    }),
  filingNum: alphaNumSpaceField("Filing number", 100),
  regDate: z.string().min(1, "Registration date is required."),
  regNum: alphaNumSpaceField("Registration number", 100),
  cnrNum: alphaNumSpaceField("CNR number", 100),
  efilingDate: z.string().optional().or(z.literal("")),
  efilingNum: z.string()
    .trim()
    .max(100, "E-filing number must be less than 101 characters.")
    .regex(
      /^[A-Z0-9 \/\\-]*$/,
      "E-filing number must contain only alphabets, numbers, spaces, and /, \\, - characters (uppercase)."
    )
    .optional()
    .or(z.literal("")),
  courtName: z.string().min(1, "Court name is required."),
  advocateIds: z.array(z.number()).min(1, "At least one advocate must be selected."),
});

