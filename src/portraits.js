import sweet from "./art/sweet.js";
import olympus from "./art/olympus.js";
import dragon from "./art/dragon.js";
export const PORTRAITS = { sweet, olympus, dragon };
export function portraitOf(id) { return PORTRAITS[id] || null; }
