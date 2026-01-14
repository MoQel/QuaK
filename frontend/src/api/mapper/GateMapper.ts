import { GateResponseDto, InspectorInfoDto, MatrixInfoDto } from "@/api/dto/library";
import { QuantumGate, InspectorInfo, MatrixInfo } from "@/views/library-view/QuantumGate";

export const GateMapper = {
    toDomain: (dto: GateResponseDto): QuantumGate => {
        return {
            id: dto.id,
            name: dto.name,
            type: dto.type,
            description: dto.description,
            qubitCount: dto.qubitCount,
            symbol: dto.symbol,
            parameters: dto.parameters || [],
            inspectorInfo: mapInspectorInfo(dto.inspectorInfo)
        };
    },

    toDomainList: (dtos: GateResponseDto[]): QuantumGate[] => {
        return dtos.map(GateMapper.toDomain);
    }
};

// Helper function to ensure UI always has valid objects
function mapInspectorInfo(dto?: InspectorInfoDto): InspectorInfo {
    if (!dto) {
        // Return Empty Object Pattern to avoid "undefined" checks in UI
        return {
            operatorDefinition: "",
            truthTable: [],
            matrix: { display: "", rows: 0, cols: 0, computable: [] }
        };
    }
    return {
        operatorDefinition: dto.operatorDefinition,
        truthTable: dto.truthTable?.map(t => ({ input: t.input, output: t.output })) || [],
        matrix: mapMatrixInfo(dto.matrix)
    };
}

function mapMatrixInfo(dto?: MatrixInfoDto): MatrixInfo {
    if (!dto) return { display: "", rows: 0, cols: 0, computable: [] };
    return {
        display: dto.display,
        rows: dto.rows,
        cols: dto.cols,
        computable: dto.computable || []
    };
}