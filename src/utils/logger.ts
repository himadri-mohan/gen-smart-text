// src/utils/logger.ts
export function logRequest(url: string, options: RequestInit) {
  console.log(`[REQUEST] URL: ${url}`);
  console.log(`[REQUEST] Options:`, options);
}

export function logResponse(url: string, response: Response, data: any) {
  console.log(`[RESPONSE] URL: ${url}`);
  console.log(`[RESPONSE] Status: ${response.status}`);
  console.log(`[RESPONSE] Data:`, data);
}

export function logError(url: string, error: any) {
  console.error(`[ERROR] URL: ${url}`);
  console.error(`[ERROR] Message:`, error);
}
