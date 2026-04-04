import { ManagedRuntime } from "effect";
import { RootLayer } from "./root-layer";

// This runtime is created once at module scope, so services built from
// RootLayer are shared across requests for the lifetime of the server process
// or dev module instance.
export const rootRuntime = ManagedRuntime.make(RootLayer);
