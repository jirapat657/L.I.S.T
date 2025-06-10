// src/utils/object.ts

export const removeUndefined = (obj: Record<string, unknown>) => {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
};
