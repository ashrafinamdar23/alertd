import { type ReactNode, useEffect } from "react";
import { message } from "antd";
import { useToastStore } from "../stores/toast";

type Props = { children: ReactNode };

export default function ToastProvider({ children }: Props) {
  // Instance-scoped message API + its required React node
  const [api, contextHolder] = message.useMessage();
  const setApi = useToastStore((s) => s.setApi);

  useEffect(() => {
    setApi(api); // register instance so all toasts use this
  }, [api, setApi]);

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
}
