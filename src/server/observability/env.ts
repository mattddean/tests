export const env = {
  PUBLIC_ENV: import.meta.env.MODE || process.env.NODE_ENV || "development",
};
