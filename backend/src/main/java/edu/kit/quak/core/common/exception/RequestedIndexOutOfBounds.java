package edu.kit.quak.core.common.exception;

public class RequestedIndexOutOfBounds extends IndexOutOfBoundsException {

    public RequestedIndexOutOfBounds(String type, int index, int max) {
        super("%s index %d is out of bounds. Valid range is between 0 and %d.".formatted(type, index, max - 1));
    }
}
