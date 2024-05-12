import { inferRouterOutputs } from "@trpc/server";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { type } from "os";
import { z } from "zod";
import { prepareMidiFromCloud } from "~/pages/play/[id]";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { midis, midisConfig } from "~/server/db/schema";
import { Midi } from "~/types/dbTypes";

export const midiRouter = createTRPCRouter({
  upload: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        midi: z.string(),
        text: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(midis).values({
        name: input.name,
        description: input.description,
        midi: input.midi,
        text: input.text,
        userId: ctx.session.user.id,
      });

      return {
        message: "Midi uploaded successfully",
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        onlyWithLyrics: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.query) {
        if (input.onlyWithLyrics) {
          return await ctx.db
            .select({
              id: midis.id,
              name: midis.name,
            })
            .from(midis)
            .where(and(eq(midis.userId, ctx.session.user.id), ne(midis.text, "")))
            .orderBy(asc(midis.name));
        }

        return await ctx.db
          .select({
            id: midis.id,
            name: midis.name,
          })
          .from(midis)
          .where(eq(midis.userId, ctx.session.user.id))
          .orderBy(asc(midis.name));
      }

      const MIDI_QUERY_SQL = sql`SELECT id, name FROM fuzzy_search_midi(${input.query}) fsm WHERE userId = ${ctx.session.user.id} ${input.onlyWithLyrics ? sql.raw("AND text != ''") : sql.raw("")} ORDER BY name ASC`;

      const midiList = (await ctx.db.execute(MIDI_QUERY_SQL)) as Midi[];
      return midiList;
    }),
  updateName: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedMidi = await ctx.db
        .update(midis)
        .set({ name: input.name })
        .where(and(eq(midis.id, input.id), eq(midis.userId, ctx.session.user.id)))
        .returning();

      if (!updatedMidi) {
        throw new Error("MIDI not found or you are not the owner");
      }

      return { message: "MIDI name updated successfully" };
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const midi = await ctx.db.query.midis.findFirst({
      where: and(eq(midis.userId, ctx.session.user.id), eq(midis.id, input.id)),
    });

    if (!midi || !midi.midi) {
      throw new Error("Midi not found");
    }

    const midiUintArray = prepareMidiFromCloud(midi?.midi);

    return {
      ...midi,
      midi: midiUintArray,
    };
  }),

  getMidiConfig: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    await validateMidiOwnerShip({
      midiId: input.id,
      userId: ctx.session.user.id,
    });

    return (
      (await ctx.db.query.midisConfig.findFirst({
        where: and(eq(midisConfig.midiId, input.id)),
      })) || {}
    );
  }),

  saveMidiConfig: protectedProcedure.input(z.object({ id: z.number(), config: z.string() })).mutation(async ({ ctx, input }) => {
    await validateMidiOwnerShip({
      midiId: input.id,
      userId: ctx.session.user.id,
    });

    await ctx.db
      .insert(midisConfig)
      .values({ midiId: input.id, config: input.config })
      .onConflictDoUpdate({
        set: { config: input.config },
        target: midisConfig.midiId,
      });

    return {
      message: "Midi config saved successfully",
    };
  }),

  remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(midis)
      .where(and(eq(midis.id, input.id), eq(midis.userId, ctx.session.user.id)))
      .returning();

    return {
      message: "Midi deleted successfully",
    };
  }),
});

async function validateMidiOwnerShip({ midiId, userId }: { midiId: number; userId: string }) {
  const midi = await db.query.midis.findFirst({
    where: and(eq(midis.userId, userId), eq(midis.id, midiId)),
  });
  if (!midi) {
    throw new Error("You are not owner of this MIDI file");
  }
}

export type GetMidiOutput = inferRouterOutputs<typeof midiRouter>["get"];
