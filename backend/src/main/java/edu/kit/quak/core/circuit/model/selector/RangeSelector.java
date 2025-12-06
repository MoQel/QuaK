package edu.kit.quak.core.circuit.model.selector;

public class RangeSelector extends Selector {
    private int begin;
    private int end;

    public int getBegin() { return begin; }
    public void setBegin(int begin) { this.begin = begin; }

    public int getEnd() { return end; }
    public void setEnd(int end) { this.end = end; }
}
