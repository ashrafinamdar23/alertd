import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Input, Space, Button, Alert, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import CoeTable from "./CoeTable";

type ListParams = { limit?: number; offset?: number; q?: string };

export type FetchListResp<T> = {
  items: T[];
  limit: number;
  offset: number;
  q?: string;
  total?: number; // optional
};

export type ModelListProps<T extends object> = {
  title: string;
  columns: ColumnsType<T>;
  fetchList: (params: ListParams) => Promise<FetchListResp<T>>;
  addLabel?: string;
  onAdd?: () => void;
  actionsColumn?: (record: T) => React.ReactNode;
  defaultLimit?: number;
  /** Change this (e.g., increment a number) to force a reload from parent */
  reloadSignal?: number | string;
};

export default function ModelList<T extends object>({
  title,
  columns,
  fetchList,
  addLabel = "Add",
  onAdd,
  actionsColumn,
  defaultLimit = 20,
  reloadSignal,
}: ModelListProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState<string>("");
  const [limit] = useState<number>(defaultLimit);
  const [offset] = useState<number>(0); // future: pagination

  const load = useCallback(
    async (search?: string) => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchList({
          limit,
          offset,
          q: search && search.trim() ? search.trim() : undefined,
        });
        setRows(res.items ?? []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [fetchList, limit, offset]
  );

  // Initial load
  useEffect(() => {
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  // External reload trigger (no debounce)
  useEffect(() => {
    if (reloadSignal !== undefined) {
      load(q);
    }
  }, [reloadSignal, load, q]);

  const tableCols = useMemo<ColumnsType<T>>(() => {
    if (!actionsColumn) return columns;
    return [
      ...columns,
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => actionsColumn(record),
        width: 140,
      },
    ];
  }, [columns, actionsColumn]);

  return (
    <Card
      title={title}
      size="small"
      extra={
        <Space>
          <Input.Search
            placeholder="Search"
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)} // debounced via effect
            onSearch={() => load(q)}                // immediate on Enter/icon
            style={{ width: 220 }}
          />
          <Button onClick={() => load(q)} size="small">Refresh</Button>
          {onAdd && (
            <Button type="primary" size="small" onClick={onAdd}>
              {addLabel}
            </Button>
          )}
        </Space>
      }
    >
      {loading ? (
        <div style={{ display: "grid", placeItems: "center", minHeight: 120 }}>
          <Spin />
        </div>
      ) : err ? (
        <Alert type="error" showIcon message="Error loading data" description={err} />
      ) : (
        <CoeTable<T>
          columns={tableCols}
          dataSource={rows}
          rowKey={"id" as any}
          striped
          pagination={false}
        />
      )}
    </Card>
  );
}
