import { useState, useCallback } from "react";

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    confirmVariant: "default", // "default" | "destructive"
    resolve: null,
  });

  const confirm = useCallback(
    ({
      title,
      description,
      confirmLabel = "Confirm",
      confirmVariant = "default",
    }) => {
      return new Promise((resolve) => {
        setState({
          open: true,
          title,
          description,
          confirmLabel,
          confirmVariant,
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false }));
  };

  return { confirm, state, handleConfirm, handleCancel };
}
