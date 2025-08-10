import * as React from "react";
import { cn } from "../../lib/utils";

export const Table = (
  props: React.TableHTMLAttributes<HTMLTableElement>,
) => (
  <table
    {...props}
    className={cn("min-w-full text-sm", props.className)}
  />
);

export const Thead = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => (
  <thead {...props} className={cn("bg-black/50 backdrop-blur", props.className)} />
);

export const Tbody = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => <tbody {...props} className={cn(props.className)} />;

export const Tr = (props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...props} className={cn("border-b panel hover:bg-white/2 transition-colors", props.className)} />
);

export const Th = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    {...props}
    className={cn(
      "text-left px-3 py-2 font-semibold text-gray-300 border-r panel last:border-r-0 sticky top-0 z-20 bg-black/60 backdrop-blur",
      props.className,
    )}
  />
);

export const Td = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    {...props}
    className={cn(
      "px-3 py-2 min-w-[120px] max-w-[360px] truncate border-r panel last:border-r-0",
      props.className,
    )}
  />
);


