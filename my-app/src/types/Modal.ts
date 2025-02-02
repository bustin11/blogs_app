// types.ts
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  modalStyle: any;
}

export interface TagFormProps {
  onSubmit: (data: { tag_name: string }) => void;
  onCancel: () => void;
}
