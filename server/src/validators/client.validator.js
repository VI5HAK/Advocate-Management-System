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
  gstSchema,
} from "./validator.js";

const baseClientSchema = z.object({
  clientTypeId: z.coerce
    .number({ invalid_type_error: "Client type is required." })
    .refine((val) => !isNaN(val) && val > 0, { message: "Client type is required." }),
  name: nameSchema,
  address: addressSchema,
  city: citySchema,
  state: stateSchema,
  Pincode: pincodeSchema,
  contactNumber: contactNumberSchema,
  alternateContactNumber: alternateContactNumberSchema,
  emailId: emailSchema,
  panNumber: panSchema,
  gstNumber: gstSchema.optional().or(z.literal("")),
  aadhaarNumber: aadhaarSchema.optional().or(z.literal("")),
  contactPerson: z
    .string({ required_error: "Contact person name is required." })
    .trim()
    .min(1, "Contact person name is required.")
    .max(50, "Contact person name must not exceed 50 characters."),
});

export function validateClient(body, clientTypeName) {
  const isIndividual = clientTypeName?.trim().toLowerCase() === "individual";

  // Normalize Pincode field casing
  const normalizedBody = {
    ...body,
    Pincode: body.Pincode !== undefined ? body.Pincode : body.pincode,
  };

  const baseResult = baseClientSchema.safeParse(normalizedBody);
  if (!baseResult.success) {
    return { error: baseResult.error.issues[0].message };
  }

  const data = baseResult.data;

  if (isIndividual) {
    if (!data.aadhaarNumber) {
      return { error: "Aadhaar number must be exactly 12 digits." };
    }
    const aadhaarCheck = aadhaarSchema.safeParse(data.aadhaarNumber);
    if (!aadhaarCheck.success) {
      return { error: "Aadhaar number must be exactly 12 digits." };
    }
    data.gstNumber = null;
  } else {
    if (!data.gstNumber) {
      return { error: "GST number must be exactly 15 alphanumeric characters." };
    }
    const gstCheck = gstSchema.safeParse(data.gstNumber);
    if (!gstCheck.success) {
      return { error: "GST number must be exactly 15 alphanumeric characters." };
    }
    data.aadhaarNumber = null;
  }

  return {
    clientData: {
      clientTypeId: data.clientTypeId,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      pinCode: Number(data.Pincode),
      contactNumber: Number(data.contactNumber),
      alternateContactNumber: Number(data.alternateContactNumber),
      emailId: data.emailId,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      aadhaarNumber: data.aadhaarNumber,
      contactPerson: data.contactPerson,
    },
  };
}
