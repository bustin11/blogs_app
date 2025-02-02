// UserForm.tsx
import React, { useEffect, useState } from "react";
import { TagFormProps } from "../types/Modal";
import axiosAuthInstance from "../utils/auth";
import { TagApiResponse } from "../types/Post";
import ScrollableList from "./scrollable_list";

const UserForm: React.FC<TagFormProps> = ({ onSubmit, onCancel,  }) => {
  const [tag_name, setTagName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [tags, setTags] = useState<TagApiResponse>({ tags: []});
  const [submitting, setSubmitting] = useState<boolean>(false);

  const listTags = async () => {
    await axiosAuthInstance
      .get<TagApiResponse>('/tags', {})
      .then((response) => {
        setTags(response.data)
      })
      .catch((err) => {
        setError('Failed to fetch tags: ' + err);
      });
    console.log(tags)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosAuthInstance.post(`/tags`, { tag_name });

    } catch (err) {
      setError('Failed to add user tag: ' + err);
    } finally {
      setError('Successful!')
    }
    setTagName('');
    
    await listTags();
    setSubmitting(false);
  };

  useEffect(() => {
    // Automatically load posts if there is no search query
    listTags();
  }, []); // This will run when page or pageSize changes, not on search query

  // Edit an item
  const handleItemEdit = async (index: number, tag_id: string, tag_name: string) => {
    await axiosAuthInstance
      .put(`/tags/${tag_id}`, { tag_name })
      .then((response) => {
        setTags(response.data)
      })
      .catch((err) => {
        setError('Failed to edit tags: ' + err);
      });
    await listTags();
  };

  // Delete an item
  const handleItemDelete = async (index: number, tag_id: string) => {
    await axiosAuthInstance
      .delete(`/tags/${tag_id}`)
      .then((response) => {
        console.log('deleted tag with id = ' + tag_id)
      })
      .catch((err) => {
        setError('Failed to edit tags: ' + err);
      });
    await listTags();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tag Name:</label>
        <input
          type="text"
          value={tag_name}
          onChange={(e) => setTagName(e.target.value)}
          required
        />
      </div>
      <div className="edit-buttons">
        <button type="submit">Submit</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
      {submitting ? 
        'loading tags ...': 
        <ScrollableList items={tags.tags} onItemEdit={handleItemEdit} onItemDelete={handleItemDelete}/>
      }
      <div>

      </div>
    </form>
  );
};

export default UserForm;
