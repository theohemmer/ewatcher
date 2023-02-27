import { EIP } from "../../utils/ewatcher";

declare global {
    namespace Express {
        interface Request {
            eips?: EIP[];
            nextFetch: number;
        }
    }
}