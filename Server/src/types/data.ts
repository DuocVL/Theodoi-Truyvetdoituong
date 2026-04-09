import { JwtPayload } from "jsonwebtoken";

export interface AccountPayload extends JwtPayload{
    id: string;
    type: "USER" | "SUBJECT";
    device_id: string;
}

declare global{
    namespace Express{
        interface Request{
            account?: AccountPayload;
            requestId: string;
        }
    }
}