import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface AccountPayload extends JwtPayload{
    id: string;
    type: "USER" | "SUBJECT";
    device_id: string;
}

export type RequestWithUser = Request & { account?: AccountPayload };

declare global{
    namespace Express{
        interface Request{
            account?: AccountPayload;
            requestId: string;
        }
    }
}