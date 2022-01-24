export const TYPING_TIMER_LENGTH: number = 400;

export const COLORS = [
  "#e21400",
  "#91580f",
  "#f8a700",
  "#f78b00",
  "#58dc00",
  "#287b00",
  "#a8f07a",
  "#4ae8c4",
  "#3b88eb",
  "#3824aa",
  "#a700ff",
  "#d300e7",
] as Array<string>;

export const SERVER_URL: string =
  (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:8081/";
