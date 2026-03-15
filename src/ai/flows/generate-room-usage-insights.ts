'use server';
/**
 * @fileOverview A Genkit flow for generating AI-powered insights from room usage log data.
 *
 * - generateRoomUsageInsights - A function that handles the AI generation of room usage insights.
 * - GenerateRoomUsageInsightsInput - The input type for the generateRoomUsageInsights function.
 * - GenerateRoomUsageInsightsOutput - The return type for the generateRoomUsageInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoomUsageLogEntrySchema = z.object({
  room_number: z.string().describe('The number or identifier of the room.'),
  professor_name: z.string().describe('The name of the professor who used the room.'),
  time_in: z.string().datetime().describe('The start time of the room usage, in ISO 8601 format.'),
  time_out: z.string().datetime().nullable().describe('The end time of the room usage, in ISO 8601 format. Null if still active.'),
});

const GenerateRoomUsageInsightsInputSchema = z.object({
  logData: z.array(RoomUsageLogEntrySchema).describe('An array of room usage log entries to analyze.'),
});
export type GenerateRoomUsageInsightsInput = z.infer<typeof GenerateRoomUsageInsightsInputSchema>;

const GenerateRoomUsageInsightsOutputSchema = z.string().describe('A natural language summary of room utilization trends, efficiency, peak usage times, and potential anomalies.');
export type GenerateRoomUsageInsightsOutput = z.infer<typeof GenerateRoomUsageInsightsOutputSchema>;

export async function generateRoomUsageInsights(input: GenerateRoomUsageInsightsInput): Promise<GenerateRoomUsageInsightsOutput> {
  return generateRoomUsageInsightsFlow(input);
}

const generateRoomUsageInsightsPrompt = ai.definePrompt({
  name: 'generateRoomUsageInsightsPrompt',
  input: {schema: GenerateRoomUsageInsightsInputSchema},
  output: {schema: GenerateRoomUsageInsightsOutputSchema},
  prompt: `You are an expert facilities manager and data analyst. Your task is to analyze room usage log data and provide a concise summary of utilization trends, efficiency, peak usage times, and potential anomalies.

The provided data is an array of room usage log entries. Each entry has the following structure:
- 'room_number': The identifier of the room (e.g., 'Room 101').
- 'professor_name': The name of the professor using the room.
- 'time_in': The start time of usage in ISO 8601 format.
- 'time_out': The end time of usage in ISO 8601 format, or null if the session is still active.

Analyze the following room usage log data:

<log_data>
{{{JSON.stringify logData false}}}
</log_data>

Based on this data, provide a summary that includes:
1.  Overall utilization trends (e.g., busy days/times, underutilized rooms).
2.  Efficiency observations (e.g., average session duration, quick turnovers).
3.  Identification of peak usage times and corresponding rooms.
4.  Any potential anomalies or unusual patterns (e.g., very long sessions, frequent short sessions, specific rooms always empty/full).

Keep the summary professional, clear, and actionable. Focus on insights that can help in resource allocation and operational decisions. Your response should be a natural language paragraph, not a list or bullet points.`,
});

const generateRoomUsageInsightsFlow = ai.defineFlow(
  {
    name: 'generateRoomUsageInsightsFlow',
    inputSchema: GenerateRoomUsageInsightsInputSchema,
    outputSchema: GenerateRoomUsageInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await generateRoomUsageInsightsPrompt(input);
    return output!;
  }
);
