import { createContext } from "react";
import type { getAnalysis } from "../utils/analysis";

export const AnalysisContext = createContext<ReturnType<typeof getAnalysis> | null>(null);
