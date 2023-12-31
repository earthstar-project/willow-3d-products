import { PredecessorFn, SuccessorFn, TotalOrder } from "../order/types.ts";
import { orderPaths, orderTimestamps } from "../order/orders.ts";
import { ClosedRange, Range, ThreeDimensionalRange } from "./types.ts";
import { Interval } from "../intervals/types.ts";

export function isValidRange<ValueType>(
  order: TotalOrder<ValueType>,
  range: Range<ValueType>,
) {
  if (range.kind === "closed_exclusive") {
    const startEndOrder = order(range.start, range.end);

    if (startEndOrder > -1) {
      return false;
    }
  } else if (range.kind === "closed_inclusive") {
    const startEndOrder = order(range.start, range.end);

    if (startEndOrder === 1) {
      return false;
    }
  }

  return true;
}

export function isValid3dRange<SubspaceIdType>(
  orderSubspace: TotalOrder<SubspaceIdType>,
  range: ThreeDimensionalRange<SubspaceIdType>,
) {
  const [subspaceRange, pathRange, timestampRange] = range;

  if (isValidRange(orderSubspace, subspaceRange) === false) {
    return false;
  }

  if (isValidRange(orderPaths, pathRange) === false) {
    return false;
  }

  if (isValidRange(orderTimestamps, timestampRange) === false) {
    return false;
  }

  return true;
}

/** Determines whether an inclusive range would have the same encoded length as an exclusive range, and if so, returns an exclusive version of that range. */
export function getSmallerFromInclusiveRange<ValueType>(
  { getSuccessor, isInclusiveSmaller }: {
    getSuccessor: SuccessorFn<ValueType>;
    isInclusiveSmaller: (inclusive: ValueType, exclusive: ValueType) => boolean;
  },
  inclusiveRange: {
    kind: "closed_inclusive";
    start: ValueType;
    end: ValueType;
  },
): ClosedRange<ValueType> {
  const exclusiveEnd = getSuccessor(inclusiveRange.end);

  if (isInclusiveSmaller(inclusiveRange.end, exclusiveEnd)) {
    return inclusiveRange;
  }

  return {
    kind: "closed_exclusive",
    start: inclusiveRange.start,
    end: exclusiveEnd,
  };
}

/** Determines whether an exclusive range would have a shorter encoded encoded length as an inclusive range, and if so, returns an exclusive version of that range. */
export function getSmallerFromExclusiveRange<ValueType>(
  { predecessor, isInclusiveSmaller }: {
    predecessor: PredecessorFn<ValueType>;
    isInclusiveSmaller: (inclusive: ValueType, exclusive: ValueType) => boolean;
  },
  exclusiveRange: {
    kind: "closed_exclusive";
    start: ValueType;
    end: ValueType;
  },
): ClosedRange<ValueType> {
  const inclusiveEnd = predecessor(exclusiveRange.end);

  if (isInclusiveSmaller(inclusiveEnd, exclusiveRange.end)) {
    return {
      kind: "closed_inclusive",
      start: exclusiveRange.start,
      end: inclusiveEnd,
    };
  }

  return exclusiveRange;
}

/** Create a new range from an `Interval`. */
export function rangeFromInterval<ValueType>(
  {
    predecessor,
    isInclusiveSmaller,
  }: {
    predecessor: PredecessorFn<ValueType>;
    isInclusiveSmaller: (incl: ValueType, excl: ValueType) => boolean;
  },
  interval: Interval<ValueType>,
): Range<ValueType> {
  if (interval.kind === "open") {
    return interval;
  }

  const inclusiveEnd = predecessor(interval.end);

  if (isInclusiveSmaller(inclusiveEnd, interval.end)) {
    return {
      kind: "closed_inclusive",
      start: interval.start,
      end: inclusiveEnd,
    };
  }

  return interval;
}

export function rangeIncludesValue<ValueType>(
  { order }: { order: TotalOrder<ValueType> },
  range: Range<ValueType>,
  value: ValueType,
): boolean {
  if (range.kind === "open") {
    return order(value, range.start) >= 0;
  } else if (range.kind === "closed_inclusive") {
    return order(value, range.start) >= 0 && order(value, range.end) <= 0;
  }

  return order(value, range.start) >= 0 && order(value, range.end) === -1;
}
