import CoeTable from "../../components/CoeTable";

type Row = { id: number; name: string; state: string };

const data: Row[] = [
  { id: 1, name: "ingestion", state: "ok" },
  { id: 2, name: "rules",     state: "ok" },
  { id: 3, name: "notify",    state: "degraded" },
];

export default function SystemStatus() {
  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <CoeTable<Row>
        columns={[
          { title: "ID", dataIndex: "id", width: 80 },
          { title: "Service", dataIndex: "name" },
          { title: "State", dataIndex: "state" },
        ]}
        dataSource={data}
        striped
        pageSize={5}
      />
    </div>
  );
}
