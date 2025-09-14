import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  HomeOutlined,
  AlertOutlined,
  SettingOutlined,
  BranchesOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const { Header, Content, Footer } = Layout;

export type NavNode = {
  label: string;
  path?: string;
  icon?: string;
  children?: NavNode[];
};

const ICONS: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  AlertOutlined: <AlertOutlined />,
  SettingOutlined: <SettingOutlined />,
  BranchesOutlined: <BranchesOutlined />,
  FileTextOutlined: <FileTextOutlined />,
};

function toMenuItems(nodes: NavNode[]): MenuProps["items"] {
  return nodes.map((n) => {
    const key = n.path || n.label;
    return {
      key,
      label: n.label,
      icon: n.icon ? ICONS[n.icon] : undefined,
      children: n.children ? toMenuItems(n.children) : undefined,
    };
  });
}

function findActiveKey(nodes: NavNode[], pathname: string): string {
  for (const n of nodes) {
    if (n.path === pathname) return n.path!;
    if (n.children) {
      const k = findActiveKey(n.children, pathname);
      if (k) return k;
    }
  }
  return pathname === "/" ? "/" : "";
}

export default function AppShell({
  nav,
  children,
}: {
  nav: NavNode[];
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = toMenuItems(nav);
  const activeKey = findActiveKey(nav, location.pathname);

  const onClick: MenuProps["onClick"] = (e) => {
    const key = e.key as string;
    if (key.startsWith("/")) navigate(key);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{ background: "white", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center" }}
      >
        <div style={{ fontWeight: 600, marginRight: 16 }}>alertd</div>
        <Menu
          mode="horizontal"
          items={items}
          onClick={onClick}
          selectedKeys={activeKey ? [activeKey] : []}
          style={{ flex: 1 }}
        />
      </Header>

      <Content style={{ background: "white" }}>{children}</Content>

      <Footer style={{ textAlign: "center" }}>
        © {new Date().getFullYear()} alertd
      </Footer>
    </Layout>
  );
}
