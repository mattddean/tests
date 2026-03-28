import { createServerFn } from "@tanstack/react-start";

export const getForrestFrankSongs = createServerFn({
  method: "GET",
}).handler(async () => [
  { id: 1, name: "YOUR WAY'S BETTER", artist: "Forrest Frank" },
  { id: 2, name: "GOOD DAY", artist: "Forrest Frank" },
  { id: 3, name: "UP!", artist: "Forrest Frank" },
  { id: 4, name: "LEMONADE", artist: "Forrest Frank" },
  { id: 5, name: "NEVER GET USED TO THIS", artist: "Forrest Frank" },
  { id: 6, name: "NO LONGER BOUND", artist: "Forrest Frank" },
  { id: 7, name: "THANKFUL", artist: "Forrest Frank" },
]);
