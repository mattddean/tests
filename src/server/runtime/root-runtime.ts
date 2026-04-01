import { ManagedRuntime } from "effect";
import { RootLayer } from "./root-layer";

export const rootRuntime = ManagedRuntime.make(RootLayer);
