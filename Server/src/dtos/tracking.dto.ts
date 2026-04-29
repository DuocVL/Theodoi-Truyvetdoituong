
import { z } from 'zod';

// Schema để validate query params cho việc truy vết
export const getTrackingLogsSchema = z.object({
    query: z.object({
        subjectId: z.string().optional(),
        startDate: z.string().datetime().optional(), // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
        endDate: z.string().datetime().optional(),   // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
        eventType: z.string().optional(),
        address: z.string().optional(),
    })
});

export type GetTrackingLogsDto = z.infer<typeof getTrackingLogsSchema>['query'];
