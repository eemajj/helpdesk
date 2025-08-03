import { useState, useEffect, useMemo } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const totalItems = items.length;
    const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleItemsCount + overscan * 2
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        visibleItems.push({
          index: i,
          item: items[i],
          offsetTop: i * itemHeight,
        });
      }
    }

    return {
      items: visibleItems,
      totalHeight: totalItems * itemHeight,
      startIndex,
      endIndex,
    };
  }, [items, itemHeight, scrollTop, overscan]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    handleScroll,
    totalHeight: visibleItems.totalHeight,
  };
}