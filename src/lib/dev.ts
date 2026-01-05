export const isDev =
  process.env.IS_DEV === "false"
    ? false
    : process.env.IS_DEV === "true" || process.env.NODE_ENV === "development";
