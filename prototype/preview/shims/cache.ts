import {persistPreview} from "../../source/lib/store";
export function revalidatePath() { persistPreview(); window.dispatchEvent(new Event("preview-refresh")); }
