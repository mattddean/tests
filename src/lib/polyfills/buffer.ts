import { Buffer } from "buffer";

import { isServer } from "@/lib/is-server";

if (!isServer && typeof globalThis !== "undefined" && !("Buffer" in globalThis)) {
  globalThis.Buffer = Buffer;
}
