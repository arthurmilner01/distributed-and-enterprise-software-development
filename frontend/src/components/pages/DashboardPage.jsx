import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ThumbsUp } from "lucide-react";


const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  // Stores all posts under the global community
  const [userPosts, setUserPosts] = useState([]);
  // Stores community posts to be filtered by user's joined communities
  const [communityPosts, setCommunityPosts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [newPost, setNewPost] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState({});
  const api = useApi();
  const [expandedPost, setExpandedPost] = useState(null);
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostVideo, setNewPostVideo] = useState(null);
  // Default tab explore posts, state used to set tab
  const [currentTab, setCurrentTab] = useState("explore-posts");




  const fetchPosts = async () => {
    try {
      const response = await api.get("api/posts/");
      const data = response.data.results ? response.data.results : response.data;
      setPosts(Array.isArray(data) ? data : []);
      console.log("Posts:", posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setErrorMessage("Failed to fetch posts.");
      setPosts([]);
    }
  };

  // Get posts from user's joined communities
  const fetchCommunityPosts = async () => {
    try {
      // Get posts from user's following
      const response = await api.get("api/posts/communities");
      
      const data = response.data.results ? response.data.results : response.data;
      
      // Update user posts with response data
      setCommunityPosts(Array.isArray(data) ? data : []);
      console.log("Community Posts:", data);
    } catch (error) {
      // Handle any errors that may occur during the API call
      console.error("Error fetching user posts:", error);
      setErrorMessage("Failed to load followed user posts.");
      
      // Reset the posts in case of an error
      setUserPosts([]);
    }
  };

  // Get posts from user's followed profiles
  const fetchUserPosts = async () => {
    try {
      // Get posts from user's following
      const response = await api.get("api/posts/following");
      
      const data = response.data.results ? response.data.results : response.data;
      
      // Update user posts with response data
      setUserPosts(Array.isArray(data) ? data : []);
      console.log("User Posts:", data);
    } catch (error) {
      // Handle any errors that may occur during the API call
      console.error("Error fetching user posts:", error);
      setErrorMessage("Failed to load followed user posts.");
      
      // Reset the posts in case of an error
      setUserPosts([]);
    }
  };



  // Update global posts when the "explore-posts" tab is set to active
  useEffect(() => {
    if (currentTab === "explore-posts") {
      fetchPosts();
    }
  }, [currentTab]);

  // Update user following posts when the "user-posts" tab is set to active
  useEffect(() => {
    if (currentTab === "user-posts") {
      fetchUserPosts();
    }
  }, [currentTab]);

  // Fetch community posts on community-posts tab
  useEffect(() => {
    if (currentTab === "community-posts") {
      fetchCommunityPosts();
    }
  }, [currentTab]);

  useEffect(() => {
    fetchPosts();
    fetchUserPosts();
    fetchCommunityPosts();
  }, []);

  const handlePostSubmit = async (event) => {
    event.preventDefault();
  
    // Prevent submission if both text and image are missing
    if (!newPost.trim() && !newPostImage) {
      setErrorMessage("Please add text or an image before posting.");
      return;
    }
  
    const formData = new FormData();
    formData.append("post_text", newPost);
    if (newPostImage) {
      formData.append("image", newPostImage);
    }
  
    try {
      const response = await api.post("api/posts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
  
      setPosts([response.data, ...posts]);
      setNewPost("");
      setNewPostImage(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };
  

  // Handles submitting likes on a specific post
  const handleLikeToggle = async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/toggle-like/`);
      const updatedPosts = posts.map((post) =>
        post.id === postId
          ? {
            ...post,
            liked_by_user: response.data.liked,
            like_count: response.data.like_count,
          }
          : post
      );
      fetchPosts();
      fetchCommunityPosts();
      fetchUserPosts();
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
      fetchPosts();
      fetchCommunityPosts();
      fetchUserPosts();
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
  

  if (loading) return <p>Loading user data...</p>;

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "20px auto" }}>
      <h2>Welcome, {user.first_name || "User"}!</h2>

      {errorMessage && (
        <div className="alert alert-danger mt-3">{errorMessage}</div>
      )}

      {/* Create Post Section */}
      <div
        className="create-post mb-4"
        style={{
          background: "#fff",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <textarea
          className="form-control mb-2"
          style={{ minHeight: "100px", resize: "none" }}
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <div className="d-flex align-items-center gap-2 mb-2">
          {/* Photo Upload Button */}
          <label
            htmlFor="photoInput"
            className="btn btn-light  border"
            style={{ fontWeight: 500 }}
          >
            📷 Photo
          </label>
          <input
            type="file"
            id="photoInput"
            accept="image/*"
            onChange={(e) => setNewPostImage(e.target.files[0])}
            style={{ display: "none" }}
          />

          {/* Video Upload Button */}
          <label
            htmlFor="videoInput"
            className="btn btn-light  border"
            style={{ fontWeight: 500 }}
          >
            🎥 Video
          </label>
          <input
            type="file"
            id="videoInput"
            accept="video/*"
            onChange={(e) => setNewPostVideo(e.target.files[0])}
            style={{ display: "none" }}
          />
        </div>

        {newPostImage && (
          <div className="mb-2">
            <img
              src={URL.createObjectURL(newPostImage)}
              alt="Selected"
              style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "8px" }}
            />
          </div>
        )}
        <button className="btn btn-primary" onClick={handlePostSubmit}>Post</button>
      </div>

      {/* Tabs to allow show/hide of different data attached to the user */}
      <ul className="nav nav-pills mb-3 d-flex justify-content-center" id="profile-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "explore-posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("explore-posts")}
          >
            Explore
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "user-posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("user-posts")}
          >
            Following
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "community-posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("community-posts")}
          >
           Community
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">

        {currentTab === "explore-posts" && (
        <div className="tab-pane fade show active">
          {/* Posts Section */}
          <div>
            {posts.length === 0 ? (
              <p>No posts in the global feed yet.</p>
            ) : (
              posts.map((post) => (
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
        )}

        {currentTab === "user-posts" && (
        <div className="tab-pane fade show active">
          {/* User Posts Section */}
          <div>
            {userPosts.length === 0 ? (
              <p>No posts in the user posts feed yet. Try following some users!</p>
            ) : (
              userPosts.map((userPost) => (
                <div
                  key={userPost.id}
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
                      src={userPost.user_image || default_profile_picture}
                      alt="User Avatar"
                      style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        <span
                            className="text-primary"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/profile/${userPost.user}`)}
                        >
                          {userPost.user_name} {userPost.user_last_name}
                        </span>
                      </div>
                      <div style={{ color: "#777", fontSize: "12px" }}>
                        {new Date(userPost.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <p>{renderPostText(userPost.post_text)}</p>

                  {userPost.image_url && (
                    <img
                      src={userPost.image_url}
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
                        backgroundColor: userPost.liked_by_user ? "#e0f7fa" : "#f1f1f1",
                        color: userPost.liked_by_user ? "#007BFF" : "#555",
                        border: "none",
                        borderRadius: "20px",
                        fontWeight: 500,
                      }}
                      onClick={() => handleLikeToggle(userPost.id)}
                    >
                      <ThumbsUp size={20} /> {userPost.liked_by_user ? "Liked" : "Like"}
                    </button>
                    <span style={{ color: "#555", fontSize: "14px" }}>
                      {userPost.like_count} {userPost.like_count === 1 ? "Like" : "Likes"}
                    </span>
                  </div>

                  {/* Comments Section */}
                  <div className="comment-section">
                    <h6>Comments</h6>
                    {userPost.comments?.length > 0 ? (
                      <ul className="list-unstyled">
                        {userPost.comments.slice(0, 5).map((comment) => (
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
                    onSubmit={(e) => handleCommentSubmit(e, userPost.id)}
                    className="d-flex mt-2"
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Write a comment..."
                      value={newComment[userPost.id] || ""}
                      onChange={(e) =>
                        setNewComment({ ...newComment, [userPost.id]: e.target.value })
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
        )}

        {currentTab === "community-posts" && (
        <div className="tab-pane fade show active">
        {/* User Posts Section */}
        <div>
          {communityPosts.length === 0 ? (
            <p>No posts in the community posts feed yet. Try joining a community!</p>
          ) : (
            communityPosts.map((communityPost) => (
              <div
                key={communityPost.id}
                className="post mb-4"
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <div className="d-flex align-items-center mb-3">
                  <div>
                    <div style={{ 
                      fontWeight: "bold"
                    }}>
                      <span
                          className="text-primary"
                          style={{ 
                            cursor: "pointer",
                            fontSize: "1.4em"
                          }}
                          onClick={() => navigate(`/communities/${communityPost.community}`)}
                      >
                          {communityPost.community_name}
                      </span>
                      <p className="text-muted fst-italic">by {" "}
                        <span 
                        className="text-muted fst-italic cursor-pointer text-decoration-underline"
                        style={{ cursor: 'pointer' }} 
                        onClick={() => navigate(`/profile/${communityPost.user}`)}
                        >
                          {communityPost.user_name} {communityPost.user_last_name}
                        </span>
                      </p>
                    </div>
                    <div style={{ color: "#777", fontSize: "12px" }}>
                      {new Date(communityPost.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <p>{renderPostText(communityPost.post_text)}</p>

                {communityPost.image_url && (
                  <img
                    src={communityPost.image_url}
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
                      backgroundColor: communityPost.liked_by_user ? "#e0f7fa" : "#f1f1f1",
                      color: communityPost.liked_by_user ? "#007BFF" : "#555",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: 500,
                    }}
                    onClick={() => handleLikeToggle(communityPost.id)}
                  >
                    <ThumbsUp size={20} /> {communityPost.liked_by_user ? "Liked" : "Like"}
                  </button>
                  <span style={{ color: "#555", fontSize: "14px" }}>
                    {communityPost.like_count} {communityPost.like_count === 1 ? "Like" : "Likes"}
                  </span>
                </div>

                {/* Comments Section */}
                <div className="comment-section">
                  <h6>Comments</h6>
                  {communityPost.comments?.length > 0 ? (
                    <ul className="list-unstyled">
                      {communityPost.comments.slice(0, 5).map((comment) => (
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
                  onSubmit={(e) => handleCommentSubmit(e, communityPost.id)}
                  className="d-flex mt-2"
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write a comment..."
                    value={newComment[communityPost.id] || ""}
                    onChange={(e) =>
                      setNewComment({ ...newComment, [communityPost.id]: e.target.value })
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
        )}

      </div>
    </div>
  )
}
export default DashboardPage;

