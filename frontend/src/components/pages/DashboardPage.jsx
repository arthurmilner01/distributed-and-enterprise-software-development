import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";

const DashboardPage = () => {
  const { user, accessToken, isAuthenticated, loading } = useAuth();

  // State for managing posts
  const [posts, setPosts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // State for creating a new post
  const [newPost, setNewPost] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for creating comments
  const [newComment, setNewComment] = useState({});
  const api = useApi();

  // ✅ Function to fetch posts (includes comments)
  const fetchPosts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/posts/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("DEBUG - Posts with Comments Fetched:", response.data);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setErrorMessage("Failed to fetch posts.");
    }
  };

  // ✅ Fetch posts on mount or whenever accessToken changes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchPosts();
    }
  }, [isAuthenticated, accessToken]);

  // ✅ Handle creating a new comment on a post
  const handleCommentSubmit = async (event, postId) => {
    event.preventDefault();

    if (!newComment[postId] || newComment[postId].trim() === "") {
      console.error("DEBUG - Comment is empty, not submitting.");
      return;
    }

    const commentData = {
      comment_text: newComment[postId],
    };

    console.log("DEBUG - Comment Data Being Sent:", commentData);

    try {
      const response = await api.post(`api/posts/${postId}/comments/`, commentData);
      console.log("DEBUG - Comment Created:", response.data);

      // ✅ Refresh posts to include the new comment
      fetchPosts();
      setNewComment({ ...newComment, [postId]: "" });
    } catch (error) {
      console.error("Failed to create comment:", error);
      if (error.response) {
        console.error("Response Data:", error.response.data);
      }
    }
  };

  // ✅ Handle creating a new post
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
        setPosts([response.data, ...posts]);
        setNewPost("");
        setIsModalOpen(false);
      })
      .catch(() => {
        setErrorMessage("Failed to create post.");
      });
  };

  // If app is still loading user data
  if (loading) {
    return <p>Loading user data...</p>;
  }

  // If user is not authenticated
  if (!isAuthenticated || !user) {
    return <p>You are not authenticated. Please log in.</p>;
  }

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
      <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setIsModalOpen(true)}>
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
            <h4 style={{ marginBottom: "15px", fontSize: "1.3rem", fontWeight: "bold" }}>Create a New Post</h4>
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
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handlePostSubmit}>
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
            <div key={post.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={post.user_image || default_profile_picture}
                  alt="User Avatar"
                  style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ddd", marginRight: "15px" }}
                />
                <div style={{ flex: 1 }}>
                  <h5>{post.user_name} {post.user_last_name}</h5>
                  <p>{post.post_text}</p>
                  <small>{new Date(post.created_at).toLocaleDateString()}</small>
                </div>
              </div>

              {/* ✅ Display Comments Under Each Post */}
              <div className="mt-3">
                <h6>Comments</h6>
                {post.comments && post.comments.length > 0 ? (
                  <ul className="list-group">
                    {post.comments.map((comment) => (
                      <li key={comment.id} className="list-group-item">
                        <strong>{comment.user_name} {comment.user_last_name}</strong>: {comment.comment_text}
                        <br />
                        <small>{new Date(comment.created_at).toLocaleDateString()}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>

              {/* Add Comment Section */}
              <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="mt-2">
                <input type="text" className="form-control" placeholder="Write a comment..." value={newComment[post.id] || ""}
                  onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })} required />
                <button type="submit" className="btn btn-primary mt-2">Comment</button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
