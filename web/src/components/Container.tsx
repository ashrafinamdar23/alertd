type Props = {
  maxWidth?: number;        // default 720px
  children: React.ReactNode;
};

export default function Container({ maxWidth = 720, children }: Props) {
  return (
    <div style={{ padding: 24, maxWidth, margin: "0 auto" }}>
      {children}
    </div>
  );
}
