import React, { useState } from 'react';
import { Tag } from '../types/Post';

// Define the type for the list item
interface ListItemProps {
  items: Tag[];
  onItemEdit: (index: number, tag_id: string, tag_name: string) => void;
  onItemDelete: (index: number, tag_id: string) => void;
}

const ScrollableList: React.FC<ListItemProps> = ({ items, onItemEdit, onItemDelete }) => {
  const [editedIndex, setEditedIndex] = useState<number | null>(null); // Track which item is being edited
  const [editedValue, setEditedValue] = useState<string>(''); // Store the value for the item being edited
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleEdit = (index: number, currentValue: string) => {
    setEditedIndex(index); // Set the index of the item being edited
    setEditedValue(currentValue); // Set the current value of the item to be edited
  };

  const handleSaveEdit = (index: number, tag_id: string) => {
    setSubmitting(true);
    onItemEdit(index, tag_id, editedValue); // Pass the new value to the parent
    setEditedIndex(null); // Exit edit mode
    setEditedValue(''); // Reset edited value
    setSubmitting(false)
  };

  const handleCancelEdit = (index: number) => {
    setEditedIndex(null); // Exit edit mode
    setEditedValue(''); // Reset edited value
  };

  const handleDelete = (index: number, tag_id: string) => {
    onItemDelete(index, tag_id); // Pass the index to remove the item
  };

  return (
    <div style={styles.container}>
      {
        submitting ? 'submitting edit ...' :
          <ul style={styles.list}>
            {items?.map((item, index) => (
              <li key={index} style={styles.listItem}>
                {editedIndex === index ? (
                  <div style={styles.editContainer}>
                    <input
                      type="text"
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      style={styles.input}
                    />
                    <button onClick={() => handleSaveEdit(index, item.id)} style={styles.saveButton}>Save</button>
                    <button onClick={() => handleCancelEdit(index)} style={styles.saveButton}>X</button>
                  </div>
                ) : (
                  <>
                    <span>{item.name}</span>
                    <button onClick={() => handleEdit(index, item.name)} style={styles.editButton}>Edit</button>
                    <button onClick={() => handleDelete(index, item.id)} style={styles.deleteButton}>X</button>
                  </>
                )}
              </li>
            ))}
          </ul>
      }
    </div>
  );
};

// Styles
export const styles = {
  container: {
    width: '300px',
    height: '200px',
    overflowY: 'auto' as 'auto',
    border: '1px solid #ccc',
    padding: '10px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '8px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    padding: '4px',
    marginRight: '8px',
    border: '1px solid #ccc',
  },
  editButton: {
    marginLeft: '8px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  deleteButton: {
    marginLeft: '8px',
    cursor: 'pointer',
    color: 'red',
    padding: '4px 8px',
  },
  saveButton: {
    padding: '4px 8px',
    cursor: 'pointer',
  },
};

export default ScrollableList;
