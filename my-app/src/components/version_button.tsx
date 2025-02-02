// App.tsx
import React, { useEffect, useState } from "react";
import Modal from "./modal";
import axiosAuthInstance from "../utils/auth";
import { BlogApiResponse, TagApiResponse } from "../types/Post";
import { Tag } from '../types/Post';
import { styles } from "./scrollable_list";

import { useCallback } from 'react';
import { Link } from "react-router-dom";

interface VersionPreview {
  version_id: number;
  updated_on: string;
}

interface ListVersionsApiResponse {
  version_previews: VersionPreview[]
}

interface ViewVersionsProps {
  blog_id: string,
  onRefresh: () => Promise<void>,
  tags: Tag[]
}

const ViewVersionsComponent: React.FC<ViewVersionsProps> = ({blog_id, onRefresh, tags}) => {
  const [versions, setVersions] = useState<VersionPreview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // Track current page number

  const refetchBlogs = async () => {
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  const listVersions = async (page_number: number) => {
    setIsLoading(true);
    try {
      const response = await axiosAuthInstance.get<ListVersionsApiResponse>(`/blogs/${blog_id}/versions`);
      setVersions(response.data.version_previews)
      // setHasMore(response.data.tags.length > 0)
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }

  };

  useEffect(() => {
    localStorage.setItem('tags', JSON.stringify(tags))
    console.log('local storage is ' + localStorage)
    listVersions(page);
  }, []);

  const loadMoreItems = (event: React.UIEvent<HTMLElement>) => {
    const target = event.target as HTMLDivElement; // Cast to HTMLDivElement
    const bottom = target.scrollHeight === target.scrollTop + target.clientHeight;
    if (bottom && hasMore && !isLoading) {
      setPage(page => page + 1);
      listVersions(page);
    }
  };

  return (
    <div
      style={{ height: '400px', overflowY: 'auto' }}
      onScroll={loadMoreItems}
    >
      <ul>
        {versions.map(version => (
          <li key={version.version_id}>
            <Link to={`/blogs/${blog_id}/versions/${version.version_id}`}>
              [version {version.version_id}]
            {new Date(version.updated_on).toLocaleString()}
            </Link>
          </li>
        ))}
      </ul>
      {isLoading && <p>Loading more items...</p>}
      {!hasMore && <p>No more items to load.</p>}
    </div>
  );
};


const VersionPreviews: React.FC<ViewVersionsProps> = ({blog_id,onRefresh,tags}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  return (
    <div>
      <button onClick={handleOpenModal}>See Versions</button>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} modalStyle={modalStyle}>
        <ViewVersionsComponent blog_id={blog_id} onRefresh={onRefresh} tags={tags}/>
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

export default VersionPreviews;
