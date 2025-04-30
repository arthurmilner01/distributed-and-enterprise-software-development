import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";
import { useNavigate, useParams } from "react-router-dom";
import { ThumbsUp, Home } from "lucide-react";


const HashtagPage = () => {
    const navigate = useNavigate();
    const { hashtagText } = useParams();
    const { user, loading } = useAuth();
    const [hashtagPosts, setHashtagPosts] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [newComment, setNewComment] = useState({});
    const api = useApi();



    const fetchHashtagPosts = async (hashtagText) => {
        try {
            const response = await api.get("/api/posts/hashtag", {
                params: { hashtag: hashtagText }, // Hashtag from URL
            });
    
            const data = response.data.results ? response.data.results : response.data;
            setHashtagPosts(Array.isArray(data) ? data : []);
            console.log("Hashtag Posts:", hashtagPosts); // You can check the fetched posts here
        } catch (error) {
            console.error("Error fetching posts:", error);
            setErrorMessage("Failed to fetch posts under this hashtag.");
            setHashtagPosts([]);
        }
    };

  useEffect(() => {
    fetchHashtagPosts(hashtagText);
  }, []);
  

  // Handles submitting likes on a specific post
  const handleLikeToggle = async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/toggle-like/`);
      const updatedPosts = hashtagPosts.map((post) =>
        post.id === postId
          ? {
            ...post,
            liked_by_user: response.data.liked,
            like_count: response.data.like_count,
          }
          : post
      );
      setHashtagPosts(updatedPosts);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

   // To save a posted comment
   const handleCommentSubmit = async (event, postId) => {
    event.preventDefault();
    if (!newComment[postId] || newComment[postId].trim() === "") return;
  
    try {
      const response = await api.post(
        `api/posts/${postId}/comments/`,
        {
          comment_text: newComment[postId],
          post: postId,
        }
      );
      console.log("Comment created:", response.data);
      fetchHashtagPosts(hashtagText);
      setNewComment({ ...newComment, [postId]: "" });
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  // Using regular expression to make hashtags links
  function renderPostText(text) {
    // If a hashtag is used before the word make it a clickable link
    // Browses to filtered posts which contain that hashtag
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith("#")) {
        const tag = word.slice(1);
        return (
          <span
            key={index}
            className="text-info"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/hashtag/${tag}`)}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  }

  const handleReturnHome = () => {
    navigate('/dashboard');  // Navigate back to dashboard
  };

  

  if (loading) return <p>Loading user data...</p>;

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "20px auto" }}>
        <button
          className="btn btn-link btn-info mb-3"
          style={{ cursor: "pointer", textDecoration:"none"}}
          onClick={handleReturnHome}
        >
          <Home /> Return to Home
        </button>
        <h5>Viewing posts under the hashtag: #{ hashtagText }</h5>

      {errorMessage && (
        <div className="alert alert-danger mt-3">{errorMessage}</div>
      )}

      <div className="tab-content mt-3">

        <div className="tab-pane fade show active">
          {/* Posts Section */}
          <div>
            {hashtagPosts.length === 0 ? (
              <p>No posts under this hashtag.</p>
            ) : (
                hashtagPosts.map((post) => (
                <div
                  key={post.id}
                  className="post mb-4"
                  style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={post.user_image || default_profile_picture}
                      alt="User Avatar"
                      style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        <span
                            className="text-primary"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/profile/${post.user}`)}
                        >
                          {post.user_name} {post.user_last_name}
                        </span>

                        <span
                            className="text-primary"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/communities/${post.community}`)}
                        >
                          <p className="text-muted fst-italic">Posted in {post.community_name} Community</p>
                        </span>
                      </div>
                      <div style={{ color: "#777", fontSize: "12px" }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p>{renderPostText(post.post_text)}</p>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      style={{
                        maxWidth: "100%",
                        borderRadius: "8px",
                        marginTop: "10px",
                        marginBottom: "10px",
                      }}
                    />
                  )}

                  {/* Like Button and Count */}
                  <div className="d-flex align-items-center mb-3">
                    <button
                      className="btn btn-sm me-2"
                      style={{
                        backgroundColor: post.liked_by_user ? "#e0f7fa" : "#f1f1f1",
                        color: post.liked_by_user ? "#007BFF" : "#555",
                        border: "none",
                        borderRadius: "20px",
                        fontWeight: 500,
                      }}
                      onClick={() => handleLikeToggle(post.id)}
                    >
                      <ThumbsUp size={20} /> {post.liked_by_user ? "Liked" : "Like"}
                    </button>
                    <span style={{ color: "#555", fontSize: "14px" }}>
                      {post.like_count} {post.like_count === 1 ? "Like" : "Likes"}
                    </span>
                  </div>

                  {/* Comments Section */}
                  <div className="comment-section">
                    <h6>Comments</h6>
                    {post.comments?.length > 0 ? (
                      <ul className="list-unstyled">
                        {post.comments.slice(0, 5).map((comment) => (
                          <li
                            key={comment.id}
                            className="d-flex align-items-start mb-2"
                            style={{ background: "#f0f2f5", padding: "8px", borderRadius: "12px" }}
                          >
                            <img
                              src={comment.user_image || default_profile_picture}
                              alt="User Avatar"
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                marginRight: "10px",
                                marginTop: "3px",
                              }}
                            />
                              <div>
                              <span
                              className="text-primary"
                              style={{ cursor: "pointer" }}
                              onClick={() => navigate(`/profile/${comment.user}`)}
                              >
                                <strong>
                                  {comment.user_name} {comment.user_last_name}
                                </strong>
                              </span>
                              : {comment.comment_text}
                              <br />
                              <small style={{ color: "#777" }}>
                                {new Date(comment.created_at).toLocaleDateString()}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No comments yet.</p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <form
                    onSubmit={(e) => handleCommentSubmit(e, post.id)}
                    className="d-flex mt-2"
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment({ ...newComment, [post.id]: e.target.value })
                      }
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-primary ms-2"
                      style={{ borderRadius: "20px" }}
                    >
                      Submit
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
export default HashtagPage;

