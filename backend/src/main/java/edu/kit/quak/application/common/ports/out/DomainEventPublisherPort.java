package edu.kit.quak.application.common.ports.out;

/** Output port for publishing domain events to interested listeners. */
public interface DomainEventPublisherPort {
    /**
     * Publishes the given event. Listeners run synchronously within the caller's transaction.
     *
     * @param event The domain event to publish
     */
    void publish(Object event);
}
