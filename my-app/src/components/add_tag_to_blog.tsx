// App.tsx
import React, { useEffect, useState } from "react";
import Modal from "./modal";
import axiosAuthInstance from "../utils/auth";
import { BlogApiResponse, TagApiResponse } from "../types/Post";
import { Tag } from '../types/Post';
import { styles } from "./scrollable_list";

import { useCallback } from 'react';

interface TagFormProps {
  blog_id: string,
  onRefresh: () => Promise<void>,
}

const AddBlogTagComponent: React.FC<TagFormProps> = ({blog_id, onRefresh}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // Track current page number

  const refetchBlogs = async () => {
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  const listTags = async (page_number: number) => {
    setIsLoading(true);
    try {
      const response = await axiosAuthInstance.get<TagApiResponse>("/tags?page_number");
      setTags(response.data.tags)
      setHasMore(response.data.tags.length > 0)
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }

  };

  useEffect(() => {
    listTags(page);
  }, []);

  const handleAddItem = async (blog_id: string, tag_id: string) => {

    try {
      await axiosAuthInstance.post(`/blogs/${blog_id}/tags/${tag_id}`);
      // Optionally, update state to reflect the addition
      console.log(`Item ${blog_id}, ${tag_id} added.`);
      refetchBlogs();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = async (blog_id: string, tag_id: string) => {
    try {
      await axiosAuthInstance.delete(`/blogs/${blog_id}/tags/${tag_id}`);
      // Optionally, update state to reflect the removal
      console.log(`Item ${blog_id}, ${tag_id} removed.`);
      refetchBlogs();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const loadMoreItems = (event: React.UIEvent<HTMLElement>) => {
    const target = event.target as HTMLDivElement; // Cast to HTMLDivElement
    const bottom = target.scrollHeight === target.scrollTop + target.clientHeight;
    if (bottom && hasMore && !isLoading) {
      setPage(page => page + 1);
      listTags(page);
    }
  };

  return (
    <div
      style={{ height: '400px', overflowY: 'auto' }}
      onScroll={loadMoreItems}
    >
      <ul>
        {tags.map(tag => (
          <li key={tag.id}>
            <span>{tag.name}</span>
            <button onClick={() => handleAddItem(blog_id, tag.id)}>+</button>
            <button onClick={() => handleRemoveItem(blog_id, tag.id)}>-</button>
          </li>
        ))}
      </ul>
      {isLoading && <p>Loading more items...</p>}
      {!hasMore && <p>No more items to load.</p>}
    </div>
  );
};



const AddTagToBlog: React.FC<TagFormProps> = ({blog_id,onRefresh}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  return (
    <div>
      <button onClick={handleOpenModal}>Add Tag To Blog</button>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} modalStyle={modalStyle}>
        <AddBlogTagComponent blog_id={blog_id} onRefresh={onRefresh}/>
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
};

export default AddTagToBlog;
