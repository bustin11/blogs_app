import React, { useState, useEffect } from 'react';
import '../App.css';
import { BlogApiResponse, Post } from '../types/Post'; // Import the updated types
import axiosAuthInstance from '../utils/auth';
import { debounce } from 'lodash'; // Import debounce from lodash
import { Link } from 'react-router-dom';
import Logout from './logout';
import Tag from './tag';
import BLogTagList from './tag_list';
import AddTagToBlog from './add_tag_to_blog';
import VersionPreviews from './version_button';
import MarkdownViewer from './markdown_viewer';

const Blogs: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<{ [key: string]: { title: string, heading: string, message: string, chapter: number, questions: string[] } }>({}); // Object to store edited fields for each post

  // Pagination states
  const [page, setPage] = useState<number>(1); // Start page from 1
  const [pageSize, setPageSize] = useState<number>(5); // Set a default page size
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sort Order
  const [sortOrder, setSortOrder] = useState<string>('desc');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search query

  // Debounced search function to make an API request after the user stops typing
  const debouncedSearch = debounce((query: string) => {
    setLoading(true); // Set loading only before API call
    axiosAuthInstance
      .get<BlogApiResponse>('/blogs', {
        params: {
          regex_pattern: query || null, // Search query or empty if none
          page_size: pageSize,
          offset: page, // Adjust offset based on page size
          sort_order: sortOrder
        },
      })
      .then((response) => {
        setPosts(response.data.posts);
        setTotalPages(Math.ceil(response.data.size / pageSize));
        setLoading(false); // Stop loading after successful request
      })
      .catch((err) => {
        setError('Failed to fetch posts: ' + err);
        setLoading(false); // Stop loading on error
      });
  }, 500); // 500ms delay before triggering the API request

  const handleSortOrderChange = () => {
    if (sortOrder === "desc") {
      setSortOrder("asc");
    } else {
      setSortOrder("desc")
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // setPage(1);
    // e.prevent 
    // e.preventDefault(); // Prevent form submission or page reload on 'Enter'
    setSearchQuery(e.target.value);  // Update the search query in the state
    debouncedSearch(e.target.value); // Call the debounced search function
  };

  // Handle the 'Enter' key to silently trigger the search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission or page reload on 'Enter'
      debouncedSearch(searchQuery); // Silently trigger the search
    }
  };

  const getBlogs = async () => {
    axiosAuthInstance
      .get<BlogApiResponse>('/blogs', {
        params: {
          page_size: pageSize,
          offset: page,
          regex_pattern: searchQuery || null, // Search query or empty if none
          sort_order: sortOrder
        },
      })
      .then((response) => {
        setPosts(response.data.posts);
        setTotalPages(Math.ceil(response.data.size / pageSize));
        setLoading(false); // Stop loading after successful request
      })
      .catch((err) => {
        setError('Failed to fetch posts: ' + err);
        setLoading(false); // Stop loading on error
      });
  }

  useEffect(() => {
    // Automatically load posts if there is no search query
    setLoading(true);
    getBlogs();
  }, [page, pageSize, sortOrder]); // This will run when page or pageSize changes, not on search query

  const handleEdit = (post_id: string, currentHeading: string, currentMessage: string, currentTitle: string, currentChapter: number, currentQuestion: string[]) => {
    setEditingPostId(post_id);
    setEditedFields({
      ...editedFields,
      [post_id]: {
        title: currentTitle,
        heading: currentHeading,
        message: currentMessage,
        chapter: currentChapter,
        questions: currentQuestion,
      },
    });
  };

  const handleSaveEdit = async (post_id: string) => {
    setSubmitting(true);
    try {
      await axiosAuthInstance.put(`/blogs/${post_id}`, {
        heading: editedFields[post_id]?.heading,
        message: editedFields[post_id]?.message,
        title: editedFields[post_id]?.title,
        chapter: editedFields[post_id]?.chapter,
        questions: editedFields[post_id]?.questions,
      });

      // After saving the edit, fetch the updated posts
      getBlogs();
      setEditingPostId(null);
      setEditedFields({});
    } catch (err) {
      setError('Failed to update the post: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedFields({});
  };

  // Pagination Handlers
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Delete post handler
  const handleDelete = async (post_id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      await axiosAuthInstance.delete(`/blogs/${post_id}`);

      // After deleting, fetch the updated posts
      getBlogs();
    } catch (err) {
      setError('Failed to delete the post: ' + err);
    }
  };

  // Handle adding a new question field
  const handleAddQuestion = (post_id: string) => {
    console.log(editedFields[post_id].questions);
    setEditedFields(prevState => ({
      ...prevState,
      [post_id]: {
        ...prevState[post_id],
        questions: [...prevState[post_id].questions, ''] // Add new question to the array
      }
    }));
  };

  const handleRemoveQuestion = (post_id: string) => {
    setEditedFields(prevState => ({
      ...prevState,
      [post_id]: {
        ...prevState[post_id],
        questions: prevState[post_id].questions.slice(0, prevState[post_id].questions.length - 1),
      }
    }));
  };

  return (
    <>
    <div className="App">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/blog_form">
          Back to Blog Form
          </Link>
        </div>
        <div className="navbar-right">
          <Tag></Tag>
        </div>
        <div><Link to="/logout">LogOut</Link></div>
      </nav>
      <div id="error">{error}</div>
      <h1>Blog Posts</h1>

      {/* Search bar */}
      <div>
        <input
          type="text"
          id="searchbar"
          placeholder="Search posts"
          value={searchQuery}
          onChange={handleSearchChange} // Update search query
          onKeyDown={handleKeyDown} // Handle the 'Enter' key to silently trigger search
        />
      </div>

      <div>
        <button type="button" onClick={() => handleSortOrderChange()}>{sortOrder}</button>
      </div>

      {/* Display posts */}
      {posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((post) => (
          <div key={post.post_id} className="blog-post">

            {/* Render the heading */}
            {editingPostId === post.post_id ? (
              <>
                <div>
                  <label htmlFor="edit-heading">Edit Heading:</label>
                  <input
                    type="text"
                    id="edit-heading"
                    value={editedFields[post.post_id]?.heading || ''}
                    onChange={(e) => setEditedFields({
                      ...editedFields,
                      [post.post_id]: {
                        ...editedFields[post.post_id],
                        heading: e.target.value,
                      }
                    })}
                  />
                </div>

                <div>
                  <span>
                    <label htmlFor="edit-chapter">Edit Chapter:</label>
                    <input
                      type="text"
                      id="edit-chapter"
                      value={editedFields[post.post_id]?.chapter || ''}
                      onChange={(e) => setEditedFields({
                        ...editedFields,
                        [post.post_id]: {
                          ...editedFields[post.post_id],
                          chapter: +e.target.value,
                        }
                      })}
                    />
                  </span>
                  <span>
                    <label htmlFor="edit-title">Edit Title:</label>
                    <input
                      type="text"
                      id="edit-title"
                      value={editedFields[post.post_id]?.title || ''}
                      onChange={(e) => setEditedFields({
                        ...editedFields,
                        [post.post_id]: {
                          ...editedFields[post.post_id],
                          title: e.target.value,
                        }
                      })}
                    />
                  </span>
                </div>

                <div>
                  <label htmlFor="edit-message">Edit Message:</label>
                  <textarea
                    id="edit-message"
                    value={editedFields[post.post_id]?.message || ''}
                    onChange={(e) => setEditedFields({
                      ...editedFields,
                      [post.post_id]: {
                        ...editedFields[post.post_id],
                        message: e.target.value,
                      }
                    })}
                  />
                  <label htmlFor="edit-question">Edit Question:</label>

                  <ul>
                    {editedFields[post.post_id].questions?.map((item, index) => (
                      <li key={index}>
                        <textarea
                          id="edit-question"
                          value={editedFields[post.post_id]?.questions[index] || ''}
                          onChange={(e) => setEditedFields({
                            ...editedFields,
                            [post.post_id]: {
                              ...editedFields[post.post_id],
                              questions: editedFields[post.post_id]?.questions.map((inner_item, inner_index) => inner_index === index ? e.target.value : inner_item),
                            }
                          })}
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="edit-buttons">
                  <button type="button" id="removeQuestion" onClick={() => handleRemoveQuestion(post.post_id)}>-</button>
                  <button type="button" id="addQuestion" onClick={() => handleAddQuestion(post.post_id)}>+</button>
                </div>

                <div className="edit-buttons">
                  <button onClick={() => handleSaveEdit(post.post_id)} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </div>
                
              </>
            ) : (
              <>
                {post.active_version} / {post.num_versions}
                <h2>{post.heading || 'No Heading'}</h2>
                <div className="meta-info">
                  <span className="chapter">{post.chapter || 'No Chapter'}</span>
                  <span className="title">{post.title || 'No Title'}</span>
                  <span className="date">{new Date(post.date).toLocaleString()}</span>
                </div>
                <div>
                  <p>Message: {<MarkdownViewer content={post.message}/>}</p>
                  <ul>
                    {post.questions?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <p className="updated-on"><b>Last Updated:</b> {new Date(post.updated_on).toLocaleString()}</p>
                  <div className="edit-buttons">
                    <button onClick={() => handleEdit(post.post_id, post.heading, post.message, post.title, post.chapter, post.questions)}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(post.post_id)}>
                      Delete
                    </button>
                    <></>
                    <AddTagToBlog blog_id={post.post_id} onRefresh={getBlogs}></AddTagToBlog>
                    <VersionPreviews blog_id={post.post_id} onRefresh={getBlogs} tags={post.tags}></VersionPreviews>
                  </div>
                </div>
                <BLogTagList responses={post.tags}/>
              </>
            )}
          </div>
        ))
      )}

      {/* Pagination Controls */}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={page === 1}>Previous</button>
        <span>{`Page ${page} of ${totalPages}`}</span>
        <button onClick={handleNextPage} disabled={page === totalPages}>Next</button>
      </div>
    </div>
    </>
  );
};

export default Blogs;
