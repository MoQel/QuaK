import { GateResponseDto } from "@/api/dto/library";
import { QuantumGate } from "@/views/QuantumGate";

export const GateMapper = {
    toDomain: (dto: GateResponseDto): QuantumGate => {
        return {
            name: dto.name,
            type: dto.type,
            description: dto.description,
            qubitCount: dto.qubitCount,
            symbol: dto.symbol,
        };
    },

    toDomainList: (dtos: GateResponseDto[]): QuantumGate[] => {
        return dtos.map(GateMapper.toDomain);
    }
};