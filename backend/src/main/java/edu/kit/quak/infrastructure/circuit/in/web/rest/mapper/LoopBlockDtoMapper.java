package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.LoopBlockDto;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface LoopBlockDtoMapper {
    default LoopBlockDto toResponse(LoopBlock domain) {
        if (domain == null) {
            return null;
        }
        return new LoopBlockDto(domain.getId(), domain.getRepeatCount(), domain.getOperationIds());
    }

    /**
     * Hand-written because {@link LoopBlock} validates in its constructor and takes its id through a
     * setter — and because a missing member list has to be named rather than dying in a Lombok
     * {@code @NonNull} check deep in the model, which would surface as an unmapped 500.
     *
     * <p>The id is taken from the request so a frame keeps its identity across the frontend's
     * full-replace saves, exactly like operations and registers do.
     */
    default LoopBlock toDomain(LoopBlockDto request) {
        if (request == null) {
            return null;
        }
        if (request.operationIds() == null) {
            throw new DomainRuleViolationException("A loop block needs the ids of the operations it covers.");
        }
        LoopBlock block = new LoopBlock(request.repeatCount(), request.operationIds());
        if (request.id() != null) {
            block.setId(request.id());
        }
        return block;
    }

    List<LoopBlockDto> toResponses(List<LoopBlock> domain);
}
