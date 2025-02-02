import React, { useState, useEffect } from 'react';
import '../App.css';
import { BlogApiResponse, BlogVersionApiResponse, Post, PostVersion, Tag } from '../types/Post'; // Import the updated types
import axiosAuthInstance from '../utils/auth';
import { debounce } from 'lodash'; // Import debounce from lodash
import { Link, useNavigate, useParams } from 'react-router-dom';
import Logout from './logout';
import BLogTagList from './tag_list';
import AddTagToBlog from './add_tag_to_blog';
import VersionPreviews from './version_button';

const BlogVersion: React.FC = () => {
  const { blog_id, version_id } = useParams();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const navigate = useNavigate();
  const [post, setPost] = useState<Post>({
    heading: '',
    title: '',
    chapter: 0,
    questions: [],
    message: '',
    date: '',
    updated_on: '',
    post_id: blog_id || '',
    tags: [],
  });

  useEffect(() => {
    const savedValue = localStorage.getItem('tags');
    setTags(savedValue ? JSON.parse(savedValue) : [])
    getBlogVersion()
  }, [])
  const getBlogVersion = async () => {
    setLoading(true)
    try {
      const response = await axiosAuthInstance.get<BlogVersionApiResponse>(`/blogs/${blog_id}/version/${version_id}`)
      setPost(response.data.post);
    } catch (e) {
      setError('Error fetching blog version' + e);
    } finally {
      setLoading(false)
    }
  }

  const setVersion = async (post_id: string) => {
    setLoading(true)
    try {
      await axiosAuthInstance.post<BlogVersionApiResponse>(`/blogs/${blog_id}/version/${version_id}/set`)
      navigate('/blogs')
    } catch (e) {
      setError('Error set blog version' + e);
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="App">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/blog_form">
          Back to Blog Form
          </Link>
        </div>
        <div><Link to="/logout">LogOut</Link></div>
      </nav>
      <div id="error">{error}</div>
      <h1>Blog Posts</h1>
      {
        loading ? 
        'loading ...' :
        (
          <div key={post.post_id} className="blog-post">
          <h2>{post.heading || 'No Heading'}</h2>
            <div className="meta-info">
              <span className="chapter">{post.chapter || 'No Chapter'}</span>
              <span className="title">{post.title || 'No Title'}</span>
              <span className="date">{new Date(post.date).toLocaleString()}</span>
            </div>
            <div>
              <p>Message: {post.message}</p>
              <ul>
                {post.questions?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="updated-on"><b>Last Updated:</b> {new Date(post.updated_on).toLocaleString()}</p>
            </div>
            <BLogTagList responses={tags}/>
            <button onClick={() => setVersion(post.post_id)}>
              Revert to Version {version_id}
            </button>
          </div>
        )
       
      }
      </div>
    </>
  )
};

export default BlogVersion;
