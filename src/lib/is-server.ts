export const isServer = !(!import.meta.env.SSR && typeof window !== "undefined");
