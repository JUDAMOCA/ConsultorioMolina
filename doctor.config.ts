import type { ReactDoctorConfig } from "react-doctor/api";

export default {
  ignore: {
    files: [
      ".next/**",
      ".agents/**",
      "node_modules/**",
      ".git/**",
      "next-env.d.ts"
    ]
  }
} satisfies ReactDoctorConfig