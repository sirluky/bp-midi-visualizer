import { type InferSelectModel } from "drizzle-orm";
import { midis } from "~/server/db/schema";

export type Midi = InferSelectModel<typeof midis>;
