import { Router } from "express";
import { readMonitoring, type HistoryQuery } from "./monitoring.repository";

function validateUntil(value: unknown, now: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("Informe um horário válido com fuso.");
  }

  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) {
    throw new Error("Informe um horário válido com fuso.");
  }

  const [year, month, day, hour, minute, second] = parts.slice(1).map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const timestamp = Date.parse(value);

  if (
    year < 1 ||
    month < 1 || month > 12 ||
    day < 1 || day > daysInMonth[month - 1] ||
    hour > 23 || minute > 59 || second > 59 ||
    !Number.isFinite(timestamp)
  ) {
    throw new Error("Informe um horário válido com fuso.");
  }

  if (timestamp > now) {
    throw new Error("Escolha um horário até o momento atual.");
  }

  return value;
}

function parseServiceIds(value: unknown): string[] {
  const serviceIds = value === undefined ? [] : Array.isArray(value) ? value : [value];

  if (
    serviceIds.length > 100 ||
    !serviceIds.every((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 255)
  ) {
    throw new Error("Seleção de aplicações inválida.");
  }

  return [...new Set(serviceIds)];
}

export function parseHistoryQuery(input: Record<string, unknown>, now = Date.now()): HistoryQuery {
  const period = input.period ?? "7d";
  if (period !== "24h" && period !== "7d") {
    throw new Error("Período inválido. Use 24h ou 7d.");
  }

  const view = input.view;
  if (view !== undefined && view !== "latest" && view !== "history") {
    throw new Error("Visualização inválida.");
  }

  const until = validateUntil(input.until, now);
  const serviceIds = parseServiceIds(input.service);

  return {
    period,
    until,
    serviceIds,
    ...(view ? { view } : {}),
  };
}

const router = Router();

router.get("/", async (req, res) => {
  let query: HistoryQuery;

  try {
    query = parseHistoryQuery(req.query);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
    return;
  }

  try {
    res.json(await readMonitoring(query));
  } catch (error) {
    if (error instanceof Error && error.message === "HISTORY_TOO_LARGE") {
      res.status(413).json({
        message: "O histórico excede o limite desta consulta. Selecione menos aplicações.",
      });
      return;
    }

    console.error("Falha ao consultar histórico persistido.");
    res.status(503).json({
      message: "Não foi possível consultar o histórico no banco. Tente novamente.",
    });
  }
});

export default router;
