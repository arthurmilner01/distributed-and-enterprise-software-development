import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";
import axios from "axios";

const DashboardPage = () => {
  const { user, accessToken, isAuthenticated, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [newPost, setNewPost] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState({});
  const api = useApi();
  const [expandedPost, setExpandedPost] = useState(null);

  const fetchPosts = async () => {
    try {
      const response = await api.get("api/posts/");
      console.log("DEBUG - API Response:", response.data);
      const data = response.data.results ? response.data.results : response.data;
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setErrorMessage("Failed to fetch posts.");
      setPosts([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchPosts();
    }
  }, [isAuthenticated, accessToken]);

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    axios
      .post(
        "http://localhost:8000/api/posts/",
        { post_text: newPost },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then((response) => {
        setPosts([response.data, ...posts]);
        setNewPost("");
        setIsModalOpen(false);
      })
      .catch((error) => {
        console.error("Failed to create post:", error);
      });
  };

  const handleCommentSubmit = async (event, postId) => {
    event.preventDefault();
    if (!newComment[postId] || newComment[postId].trim() === "") return;
    axios
      .post(
        `http://localhost:8000/api/posts/${postId}/comments/`,
        { comment_text: newComment[postId], post: postId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then(() => {
        fetchPosts();
        setNewComment({ ...newComment, [postId]: "" });
      })
      .catch((error) => {
        console.error("Failed to create comment:", error);
      });
  };

  if (loading) return <p>Loading user data...</p>;
  if (!isAuthenticated || !user) return <p>You are not authenticated. Please log in.</p>;

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "20px auto" }}>
      <h2>Welcome, {user.first_name || "User"}!</h2>

      {errorMessage && <div className="alert alert-danger" style={{ marginTop: "1rem" }}>{errorMessage}</div>}

      <div className="create-post" style={{ background: "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <textarea
          style={{ width: "100%", padding: "10px", borderRadius: "5px", resize: "none", border: "1px solid #ddd", minHeight: "100px", marginBottom: "10px" }}
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <button className="post-btn" style={{ background: "#4267B2", color: "#fff", padding: "8px 16px", border: "none", borderRadius: "5px", cursor: "pointer" }} onClick={handlePostSubmit}>Post</button>
      </div>

      <div>
        {posts.length === 0 ? <p>No posts in the global feed yet.</p> : posts.map((post) => (
          <div key={post.id} className="post" style={{ background: "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
              <img
                src={post.user_image || default_profile_picture}
                alt="User Avatar"
                style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
              />
              <div>
                <span style={{ fontWeight: "bold" }}>{post.user_name} {post.user_last_name}</span>
                <span style={{ color: "#777", fontSize: "12px", marginLeft: "5px" }}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <p>{post.post_text}</p>

            <div className="comment-section">
              <h6>Comments</h6>
              {post.comments?.length > 0 ? (
                <ul>
                  {post.comments.slice(0, 3).map((comment) => (
                    <li key={comment.id} style={{ display: "flex", alignItems: "center", background: "#f0f2f5", padding: "8px", borderRadius: "12px", marginBottom: "5px" }}>
                      <img
                        src={comment.user_image || default_profile_picture}
                        alt="User Avatar"
                        style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "10px" }}
                      />
                      <div>
                        <strong>{comment.user_name} {comment.user_last_name}</strong>: {comment.comment_text}
                        <br />
                        <small style={{ color: "#777" }}>{new Date(comment.created_at).toLocaleDateString()}</small>
                      </div>
                    </li>

                  ))}
                </ul>
              ) : <p>No comments yet.</p>}
            </div>

            <form onSubmit={(e) => handleCommentSubmit(e, post.id)} style={{ display: "flex", marginTop: "10px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Write a comment..."
                value={newComment[post.id] || ""}
                onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                required
                style={{ flex: 1, borderRadius: "20px", padding: "8px 15px", border: "1px solid #ddd" }}
              />
              <button type="submit" className="btn btn-primary" style={{ marginLeft: "10px", borderRadius: "20px" }}>Submit</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
