// Modal.tsx
import React from "react";
import { ModalProps } from "../types/Modal";


const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, modalStyle }) => {
  if (!isOpen) return null;
  console.log(children)
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose}>X</button>
        {children}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#EDE6D6',
    padding: '20px',
    borderRadius: '8px',
    borderStyle: 'solid', // required for the border to be visible
    minWidth: '300px',
    maxWidth: '500px',
  },
  closeButton: {
    // position: 'absolute' as const,
    // top: '10px',
    // right: '10px',
    // background: 'none',
    // border: 'none',
    // fontSize: '16px',
    // cursor: 'pointer',
  }
};

export default Modal;
