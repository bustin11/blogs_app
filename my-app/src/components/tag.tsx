// App.tsx
import React, { useState } from "react";
import Modal from "./modal";
import UserForm from "./tag_form";
import axiosAuthInstance from "../utils/auth";
import { BlogApiResponse } from "../types/Post";

const Tag: React.FC<any> = ({children}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleFormSubmit = async (data: { tag_name: string; }) => {
    console.log("Form Data:", data);
    // setIsModalOpen(false);
    try {
      await axiosAuthInstance.post(`/tags`, data);

    } catch (err) {
      setError('Failed to add user tag: ' + err);
    } finally {
      setError('Successful!')
    }
  };

  const handleCancel = () => {
    console.log("Form canceled");
    setIsModalOpen(false);
  };
  return (
    <div>
      {children}
      <button onClick={handleOpenModal}>Add Tag Please</button>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} modalStyle={modalStyle}>
        <p>Enter Tag Name Below:</p>
        <UserForm onSubmit={handleFormSubmit} onCancel={handleCancel} />
      </Modal>
    </div>
  );
};

const modalStyle = {
  backgroundColor: '#EDE6D6',
  padding: '20px',
  borderRadius: '8px',
  borderStyle: 'solid', // required for the border to be visible
  minWidth: '300px',
  maxWidth: '500px',
  position: 'absolute' as const,
};

export default Tag;
