export type LibraryStatus = "want" | "reading" | "paused" | "completed";

export const LIBRARY_STATUS: Record<LibraryStatus, string> = {
  want: "Quero ler",
  reading: "Lendo",
  paused: "Pausadas",
  completed: "Concluídas",
};
