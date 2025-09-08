// src/components/reuniones/meetings-list.tsx
import { MeetingWithTasks } from "@/lib/types";
import { MeetingsView } from "./meetings-view";
import { getMeetings } from "@/lib/data/meetings";


export async function MeetingsList() {
    const meetings = await getMeetings({});
    return <MeetingsView initialMeetings={meetings} />;
}
