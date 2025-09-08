// src/lib/data/meetings.ts
'use server';

import { dataService } from "../services/data-service";
import type { MeetingWithDetails } from "../types";

export async function getMeetings({ query }: { query?: string }): Promise<MeetingWithDetails[]> {
    const filters = query ? { title: { ilike: `%${query}%` } } : undefined;
    
    const data = await dataService.findMany('meetings', {
        select: `
            *,
            tasks:meeting_tasks (
                *,
                responsible:users(*)
            ),
            participant_groups:meeting_participant_groups (
                group_name
            )
        `,
        filters,
        orderBy: { date: 'desc' }
    });

    return data.map((meeting: any) => ({
        ...meeting,
        participant_groups: meeting.participant_groups.map((p: any) => p.group_name)
    })) as MeetingWithDetails[];
}
