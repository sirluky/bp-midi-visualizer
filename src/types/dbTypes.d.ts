import { type InferSelectModel } from "drizzle-orm";
import { type midis } from "~/server/db/schema";

export type Midi = InferSelectModel<typeof midis>;
