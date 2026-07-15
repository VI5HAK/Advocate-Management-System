import { z } from "zod";
import {
  nameSchema,
  addressSchema,
  citySchema,
  stateSchema,
  pincodeSchema,
  contactNumberSchema,
  alternateContactNumberSchema,
  emailSchema,
  panSchema,
  aadhaarSchema,
} from "./validator.js";

const baseAdvocateSchema = z.object({
  roleId: z.coerce
    .number({ invalid_type_error: "Role is required." })
    .refine((val) => !isNaN(val) && val > 0, { message: "Role is required." }),
  name: nameSchema,
  address: addressSchema,
  city: citySchema,
  state: stateSchema,
  Pincode: pincodeSchema,
  contactNumber: contactNumberSchema,
  alternateContactNumber: alternateContactNumberSchema,
  emailId: emailSchema,
  panNumber: panSchema,
  aadhaarNumber: aadhaarSchema,
});

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 12;

export function validatePasswordPair(password, confirmPassword, required) {
  if (!password && !confirmPassword) {
    if (required) {
      return { error: "Password and confirm password are required." };
    }
    return { plainPassword: null };
  }

  if (!password || !confirmPassword) {
    return { error: "Password and confirm password are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Password and confirm password do not match." };
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return {
      error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }

  return { plainPassword: password };
}

export function validateAdvocate(body, requirePassword = true) {
  // Normalize fields to ensure case safety
  const normalizedBody = {
    ...body,
    Pincode: body.Pincode !== undefined ? body.Pincode : body.pincode,
  };

  const baseResult = baseAdvocateSchema.safeParse(normalizedBody);
  if (!baseResult.success) {
    return { error: baseResult.error.issues[0].message };
  }
  const data = baseResult.data;

  // Password validation
  const passwordResult = validatePasswordPair(
    normalizedBody.password,
    normalizedBody.confirmPassword,
    requirePassword
  );
  if (passwordResult.error) {
    return { error: passwordResult.error };
  }

  return {
    advocateData: {
      roleId: data.roleId,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      pinCode: Number(data.Pincode),
      contactNumber: Number(data.contactNumber),
      alternateContactNumber: Number(data.alternateContactNumber),
      emailId: data.emailId,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
    },
    plainPassword: passwordResult.plainPassword,
  };
}
