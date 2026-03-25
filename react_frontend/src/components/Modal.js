import React, { useEffect } from "react";
import "./modal.css";

// PUBLIC_INTERFACE
export function Modal({ title, children, onClose, footer, size = "md" }) {
  /** Accessible modal dialog with ESC + backdrop close. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="mqms-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`mqms-modal mqms-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mqms-modal__header">
          <div className="mqms-modal__title">{title}</div>
          <button className="mqms-icon-btn" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className="mqms-modal__body">{children}</div>
        {footer ? <div className="mqms-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
