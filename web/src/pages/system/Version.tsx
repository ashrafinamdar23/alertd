import { useEffect, useState, useCallback } from "react";
import { Card, Descriptions, Spin, Alert, Typography, Button } from "antd";
import System, { type VersionInfo } from "../../services/system";
import Container from "../../components/Container";

export default function SystemVersion() {
  const [data, setData] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const v = await System.version();
      setData(v);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch version");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Container><Spin /></Container>;
  if (err) return <Container><Alert type="error" message="Error loading version" description={err} showIcon /></Container>;
  if (!data) return null;

  const builtAtLocal = data.builtAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.builtAt))
    : "-";

  return (
    <Container>
      <Card
        title="Application Version"
        size="small"
        extra={<Button size="small" onClick={load}>Refresh</Button>}
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Version">
            <Typography.Text code>{data.version}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Commit">
            <Typography.Text code copyable>{data.commit}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Built At">
            {builtAtLocal}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Container>
  );
}
