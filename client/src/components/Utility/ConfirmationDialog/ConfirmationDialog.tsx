import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./ConfirmationDialog.css";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="confirmation-dialog-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="confirmation-dialog-close"
          onClick={onCancel}
          aria-label="Close confirmation dialog"
        >
          <X size={18} />
        </button>
        <h2 id="confirmation-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirmation-dialog-actions">
          <button type="button" className="auth-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="auth-btn primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationDialog;
