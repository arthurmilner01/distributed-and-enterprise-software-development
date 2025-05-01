import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../api";
import { useNavigate, useParams } from "react-router-dom";
import { Home } from "lucide-react";
import Post from "../widgets/Post";


const HashtagPage = () => {
    const navigate = useNavigate();
    const { hashtagText } = useParams();
    const { user, loading } = useAuth();
    const [hashtagPosts, setHashtagPosts] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [newComment, setNewComment] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const api = useApi();



    const fetchHashtagPosts = async (hashtagText) => {
        try {
            const response = await api.get("/api/posts/hashtag", {
                params: { hashtag: hashtagText }, // Hashtag from URL
            });
    
            const data = response.data.results ? response.data.results : response.data;
            setHashtagPosts(Array.isArray(data) ? data : []);
            console.log("Hashtag Posts:", hashtagPosts);
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

  const handleDeletePost = async (postId) => {
    try {
      // Send DELETE request
      const response = await api.delete(`/api/posts/${postId}/`);
  
      // Update the state to reflect the deleted post
      fetchHashtagPosts();
      setSuccessMessage("Post successfully deleted.");
      setErrorMessage("");
    } catch (error) {
      // Handle error if deletion fails
      console.error("Error deleting post:", error);
      setErrorMessage("Failed to delete the post, does the post belong to you?.");
      setSuccessMessage("");
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
      {successMessage && (
        <div className="alert alert-success mt-3">{successMessage}</div>
      )}

      <div className="tab-content mt-3">

        <div className="tab-pane fade show active">
          {/* Posts Section */}
          <div>
          {hashtagPosts.length === 0 ? (
            <p>No posts under this hashtag.</p>
          ) : (
            hashtagPosts.map((post) => (
              <Post
                key={post.id}
                post={post}
                user={user}
                renderPostText={renderPostText}
                handleLikeToggle={handleLikeToggle}
                handleDeletePost={handleDeletePost}
                handleCommentSubmit={handleCommentSubmit}
                newComment={newComment}
                setNewComment={setNewComment}
              />
            ))
          )}
          </div>
        </div>

      </div>
    </div>
  )
}
export default HashtagPage;

