// lib/r2.ts
import { S3Client } from "@aws-sdk/client-s3";

const endpointBase = `https://${process.env.R2_ACCOUNT_ID}${
  process.env.R2_JURISDICTION ? `.${process.env.R2_JURISDICTION}` : ""
}.r2.cloudflarestorage.com`;

export const r2 = new S3Client({
  region: "auto",
  endpoint: endpointBase,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
