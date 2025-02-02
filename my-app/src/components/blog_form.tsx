import React, { useState, useEffect } from 'react';
import '../App.css';
import axiosAuthInstance from '../utils/auth';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


const BlogForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [editedFields, setEditedFields] = useState<{title: string, heading: string, message: string, chapter: number, questions: string[]}>({
    title: '',
    heading: '',
    message: '',
    chapter: 0,
    questions: ['']
  }); // Object to store edited fields for each post

  const navigate = useNavigate();
  
  // Handle adding a new question field
  const handleAddQuestion = () => {
    setEditedFields({
      ...editedFields,
      questions: [...editedFields.questions, ''],
    })
  };

  const handleRemoveQuestion = () => {
    setEditedFields({
      ...editedFields,
      questions: editedFields.questions.slice(0, editedFields.questions.length - 1),
    })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      await axiosAuthInstance.post('/blogs', editedFields);
      setEditedFields({
        title: '',
        heading: '',
        message: '',
        chapter: 0,
        questions: ['']
      })
      navigate('/blogs');
    } catch (err) {
      setError('Failed to submit the post: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/blogs">
          Back to Blogs
          </Link>
        </div>
        <div><Link to="/logout">LogOut</Link></div>
      </nav>
      <div id="error">{error}</div>
      <h1>Blog Posts</h1>
      {/* Form for submitting a new post */}
      <form onSubmit={handleSubmit} className="post-form">
        <div>
          <label htmlFor="heading">Heading:</label>
          <input
            type="text"
            id="heading"
            value={editedFields['heading']}
            onChange={(e) => setEditedFields({
              ...editedFields,
              heading: e.target.value,
            })}
            placeholder="Enter post heading"
          />
        </div>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={editedFields['title']}
            onChange={(e) => setEditedFields({
              ...editedFields,
              title: e.target.value,
            })}
            placeholder="Enter post title"
          />
        </div>

        <div>
          <label htmlFor="chapter">Chapter:</label>
          <input
            type="text"
            id="chapter"
            value={editedFields['chapter']}
            onChange={(e) => setEditedFields({
              ...editedFields,
              chapter: +e.target.value,
            })}
            placeholder="Enter post chapter"
          />
        </div>

        <div>
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={editedFields['message']}
            onChange={(e) => setEditedFields({
              ...editedFields,
              message: e.target.value,
            })}
            placeholder="Enter post message"
          />
        </div>

        <div>
          <label htmlFor="question">Questions:</label>
          {
            editedFields.questions.map((question, index) => (
              <textarea
                id="question"
                value={question}
                onChange={
                  (e) => setEditedFields({
                      ...editedFields,
                      questions: editedFields.questions.map((inner_question, inner_index) => inner_index == index ? e.target.value : inner_question),
                  })
                }
                placeholder="Enter question"
              />
            ))
          }
        </div>

        <div className="edit-buttons">
          <button type="button" id="removeQuestion" onClick={handleRemoveQuestion}>-</button>
          <button type="button" id="addQuestion" onClick={handleAddQuestion}>+</button>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Post'}
        </button>
      </form>
    </div>
  );
};

export default BlogForm;
