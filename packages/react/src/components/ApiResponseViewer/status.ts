import type { PillShade } from "../core/Pill";
import type { HttpMethod } from "./ApiResponseViewer";

const STATUS_PHRASES: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

/** Maps HTTP methods to pill shades — read vs write semantics (Postman-style). */
export function methodPillShade(method: HttpMethod): PillShade {
  switch (method) {
    case "GET":
    case "HEAD":
      return "green";
    case "POST":
      return "orange";
    case "PUT":
      return "blue";
    case "PATCH":
      return "teal";
    case "DELETE":
      return "red";
    case "OPTIONS":
      return "gray";
  }
}

/** Maps HTTP status code ranges to pill shades for quick visual scanning. */
export function statusPillShade(status: number): PillShade {
  if (status >= 500) return "red";
  if (status >= 400) return "orange";
  if (status >= 300) return "teal";
  return "green";
}

/** Common reason phrase for a status code, or the numeric code as a string. */
export function statusReasonPhrase(status: number): string {
  return STATUS_PHRASES[status] ?? String(status);
}
