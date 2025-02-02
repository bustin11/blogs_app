import React, { useState, useEffect, useRef } from "react";
import { Tag } from "../types/Post";


type BlogTagListProps = {
  responses: Tag[];
};

const BLogTagList: React.FC<BlogTagListProps> = ({ responses }) => {
  const [visibleBlogTags, setVisibleBlogTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initially show the first 5 responses
    setVisibleBlogTags(responses.slice(0, 5));
  }, [responses]);

  const loadMoreBlogTags = () => {
    if (isLoading || visibleBlogTags.length >= responses.length) return;
    setIsLoading(true);
    const nextResponses = responses.slice(visibleBlogTags.length, visibleBlogTags.length + 5);
    setTimeout(() => {
      setVisibleBlogTags((prev) => [...prev, ...nextResponses]);
      setIsLoading(false);
    }, 500); // Simulating loading delay
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMoreBlogTags();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        overflowY: "auto",
        maxHeight: "400px",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "flex-start",
        }}
      >
        {visibleBlogTags.map((blog_tag, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px 15px",
              borderRadius: "8px",
              maxWidth: "250px",
              wordWrap: "break-word",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            {blog_tag.name}
          </div>
        ))}
      </div>

      {visibleBlogTags.length < responses.length && (
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            cursor: "pointer",
            color: "#007bff",
          }}
          onClick={loadMoreBlogTags}
        >
          {isLoading ? "Loading..." : "View More"}
        </div>
      )}
    </div>
  );
};

export default BLogTagList;
