import { z } from 'zod';

//schema dùng tạo bản ghi location
export const createLocationHistory = z.object({
    body: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number().optional(),  
        speed: z.number().optional(),       
        altitude: z.number().optional(),  

    })
});

export type CreateLocationHistoryDto = z.infer<typeof createLocationHistory>['body'];