import { Modal } from "antd";

type Props = {
  title: string;
  open: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  children: React.ReactNode;
  width?: number;
  destroyOnClose?: boolean;
};

export default function CoeModal({
  title,
  open,
  onOk,
  onCancel,
  okText = "OK",
  cancelText = "Cancel",
  confirmLoading,
  children,
  width = 520,
  destroyOnClose = true,
}: Props) {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      destroyOnClose={destroyOnClose}
      width={width}
    >
      {children}
    </Modal>
  );
}
