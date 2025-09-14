import { Table } from "antd";
import type { TableProps } from "antd";

/**
 * Unified table wrapper:
 * - compact rows (size="small")
 * - bordered
 * - striped rows (optional, default true) without custom CSS
 * - sensible default pagination (10/page), override or disable as needed
 * - keeps all Table props overridable
 */
export type CoeTableProps<T extends object> = Omit<TableProps<T>, "size"> & {
  striped?: boolean;  // default: true
  pageSize?: number;  // default: 10 (used only if pagination not provided)
};

export default function CoeTable<T extends object>({
  striped = true,
  pageSize = 10,
  pagination,
  onRow,
  rowKey,
  locale,
  ...rest
}: CoeTableProps<T>) {
  // If consumer passed pagination=false, keep it. If they passed an object, use it.
  // Otherwise apply our default.
  const mergedPagination =
    pagination === undefined ? { pageSize, showSizeChanger: false } : pagination;

  return (
    <Table<T>
      size="small"
      bordered
      rowKey={rowKey ?? ("id" as any)}
      pagination={mergedPagination}
      locale={{ emptyText: "No data", ...(locale ?? {}) }}
      onRow={(record, index) => {
        const base = onRow ? onRow(record, index) : {};
        const stripeStyle =
          striped && typeof index === "number" && index % 2 === 1
            ? { backgroundColor: "#fafafa" }
            : {};
        return { ...base, style: { ...(base as any).style, ...stripeStyle } };
      }}
      {...rest}
    />
  );
}
