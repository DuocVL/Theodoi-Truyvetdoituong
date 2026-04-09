import { z } from 'zod';

export const CreaterUserDto = z.object({
    full_name: z.string().min(1),
    email: z.email(),
});


export type CreaterUserDto = z.infer<typeof CreaterUserDto>;