import React from "react"

type ConfirmModalProps = {
  id: string
  isOpen: boolean
  title?: string
  message: string
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  id,
  isOpen,
  title = "確認",
  message,
  cancelText = "いいえ",
  confirmText = "はい",
  onConfirm,
  onCancel
}: ConfirmModalProps): React.JSX.Element {
  return (
    <>
      <input type="checkbox" id={id} className="modal-toggle" checked={isOpen} readOnly />
      <div className="modal cursor-pointer">
        <div className="modal-box relative max-w-lg" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4">{title}</h3>
          <p className="mb-6 whitespace-pre-line">{message}</p>
          <div className="modal-action justify-end">
            <label htmlFor={id} className="btn btn-outline" onClick={onCancel}>
              {cancelText}
            </label>
            <label htmlFor={id} className="btn btn-primary" onClick={onConfirm}>
              {confirmText}
            </label>
          </div>
        </div>
      </div>
    </>
  )
}
