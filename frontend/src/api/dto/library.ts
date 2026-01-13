import {GateType} from '@/api/dto/GateType.ts'

export interface LibraryGateResponse {
    name: string;
    symbol: GateType;
    type: string;
    description: string;
    qubitCount: number;
}