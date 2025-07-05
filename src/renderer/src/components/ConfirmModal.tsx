import React from "react"
import { BaseModal } from "./BaseModal"

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
  const footer = (
    <div className="justify-end">
      <button className="btn btn-outline" onClick={onCancel}>
        {cancelText}
      </button>
      <button className="btn btn-primary" onClick={onConfirm}>
        {confirmText}
      </button>
    </div>
  )

  return (
    <BaseModal
      id={id}
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      size="lg"
      showCloseButton={false}
      footer={footer}
    >
      <p className="mb-6 whitespace-pre-line">{message}</p>
    </BaseModal>
  )
}
