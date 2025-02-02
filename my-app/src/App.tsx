import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BlogForm from './components/blog_form';
import Blogs from './components/blogs';
import Login from './components/login';
import SignUp from './components/sign_up';
import Logout from './components/logout';
import BlogVersion from './components/blog_versions';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blog_form" element={<BlogForm />} />
          <Route path="/blogs/:blog_id/versions/:version_id" element={<BlogVersion />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
