import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const DashboardPage = () => {
  const { user, accessToken, isAuthenticated, loading } = useAuth();

  // State for managing posts
  const [posts, setPosts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // State for creating a new post
  const [newPost, setNewPost] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If app is still loading user data
  if (loading) {
    return <p>Loading user data...</p>;
  }

  // If user is not authenticated
  if (!isAuthenticated || !user) {
    return <p>You are not authenticated. Please log in.</p>;
  }

  // Fetch posts on mount or whenever accessToken changes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      axios
        .get("http://localhost:8000/api/posts/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          setPosts(response.data);
        })
        .catch((error) => {
          setErrorMessage("Failed to fetch posts.");
        });
    }
  }, [isAuthenticated, accessToken]);

  // Handle creating a new post
  const handlePostSubmit = (event) => {
    event.preventDefault();
    if (!newPost) return; // Don't submit empty posts

    axios
      .post(
        "http://localhost:8000/api/posts/",
        { post_text: newPost },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        // Add the new post to the top of the list
        setPosts([response.data, ...posts]);
        // Clear the text area
        setNewPost("");
        // Close the modal
        setIsModalOpen(false);
      })
      .catch((error) => {
        setErrorMessage("Failed to create post.");
      });
  };

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <h2>Welcome, {user.first_name || "User"}!</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role || "N/A"}</p>

      {/* Error Message */}
      {errorMessage && (
        <div className="alert alert-danger" style={{ marginTop: "1rem" }}>
          {errorMessage}
        </div>
      )}

      {/* Button to open the modal */}
      <button
        className="btn btn-primary"
        style={{ marginTop: "1rem" }}
        onClick={() => setIsModalOpen(true)}
      >
        Create Post
      </button>

      {/* Inline-styled modal for creating a post */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              width: "400px",
              maxWidth: "90%",
              borderRadius: "8px",
              border: "2px solid #ccc",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)",
              color: "#333",
            }}
          >
            <h4
              style={{
                marginBottom: "15px",
                fontSize: "1.3rem",
                fontWeight: "bold",
              }}
            >
              Create a New Post
            </h4>
            <textarea
              style={{
                width: "100%",
                fontSize: "14px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                resize: "none",
                height: "80px",
                marginBottom: "10px",
              }}
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows="3"
              required
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button
                style={{
                  minWidth: "80px",
                  padding: "8px 20px",
                  fontSize: "14px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "#e0e0e0",
                  color: "#333",
                }}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
              <button
                style={{
                  minWidth: "80px",
                  padding: "8px 20px",
                  fontSize: "14px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "#007bff",
                  color: "#fff",
                }}
                onClick={handlePostSubmit}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Displaying Posts */}
      <div style={{ marginTop: "2rem" }}>
        <h3>Global Feed</h3>
        {posts.length === 0 ? (
          <p>No posts in the global feed yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "15px",
              }}
            >
              {/* Left: User Avatar (if user_image is returned) */}
              <div style={{ marginRight: "15px" }}>
                <img
                  src={post.user_image || default_profile_picture}
                  alt="User Avatar"
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ddd",
                  }}
                />
              </div>


              {/* Middle: Post Content */}
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: 0 }}>
                  {post.user_name} {post.user_last_name}
                </h5>
                <p style={{ margin: "5px 0" }}>{post.post_text}</p>
                <small style={{ color: "#999" }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </small>
              </div>

              {/* Right: Heart icon + likes */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <button
                      className="btn btn-outline-danger" style={{ fontSize: "1.5rem", marginBottom: "5px" }}>❤️</button>
                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                  {post.likes || 0} Likes
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
