import { z } from "zod";
import {
  nameSchema,
  addressSchema,
  stateCodeSchema,
  districtCodeSchema,
  talukCodeSchema,
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
  stateCode: stateCodeSchema,
  districtCode: districtCodeSchema,
  talukCode: talukCodeSchema,
  Pincode: pincodeSchema,
  contactNumber: contactNumberSchema,
  alternateContactNumber: alternateContactNumberSchema,
  emailId: emailSchema.optional().or(z.literal("")),
  panNumber: panSchema.optional().or(z.literal("")),
  gstNumber: z.string().optional().or(z.literal("")),
  aadhaarNumber: z.string().optional().or(z.literal("")),
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
    if (data.aadhaarNumber && data.aadhaarNumber.trim() !== "") {
      const aadhaarCheck = aadhaarSchema.safeParse(data.aadhaarNumber);
      if (!aadhaarCheck.success) {
        return { error: "Aadhaar number must be exactly 12 digits." };
      }
    } else {
      data.aadhaarNumber = null;
    }
    data.gstNumber = null;
  } else {
    if (data.gstNumber && data.gstNumber.trim() !== "") {
      const gstCheck = gstSchema.safeParse(data.gstNumber);
      if (!gstCheck.success) {
        return { error: "GST number must be exactly 15 alphanumeric characters." };
      }
    } else {
      data.gstNumber = null;
    }
    data.aadhaarNumber = null;
  }

  return {
    clientData: {
      clientTypeId: data.clientTypeId,
      name: data.name,
      address: data.address,
      stateCode: data.stateCode,
      districtCode: data.districtCode,
      talukCode: data.talukCode,
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
