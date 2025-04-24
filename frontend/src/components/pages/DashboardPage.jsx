import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ThumbsUp } from "lucide-react";


const DashboardPage = () => {
  const { user, accessToken, loading } = useAuth();
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
  // Stores user's following for filtering posts
  const [userFollowing, setUserFollowing] = useState([]);
  // Stores user's communities for filtering posts
  const [userCommunities, setUserCommunities] = useState([]);
  // Stores filtered community posts
  const [filteredCommunityPosts, setFilteredCommunityPosts] = useState([]);




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

  // Fetch all community posts
  const fetchCommunityPosts = async () => {
    // "all" param returns all community posts except global community
    try {
      const response = await api.get("api/posts/", {
        params: { community: "all" },
      });      
      setCommunityPosts(response.data);
      console.log("Community Posts:", communityPosts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      setErrorMessage("Failed to fetch community posts.");
      setPosts([]);
    }
  };

  // Get list of user's following, used to filter posts
  const fetchFollowingList = async () => {
    try {
      const response = await api.get(`api/follow/following`);
      // Return only the user IDs
      const followingUserIds = response.data.map(user => user.id);
      setUserFollowing(followingUserIds);
      console.log("Following IDs:", userFollowing);
    } catch (error) {
      console.error("Error fetching following list:", error);
    }
  };

  // Get list of user's communities, used to filter community posts
  const fetchCommunityList = async () => {
    try {
      const response = await api.get(`api/communityfollow/user_communities_list`);
      // Return only the community IDs
      const followingCommunityIDs = response.data.map(community => community.community_id);
      setUserCommunities(followingCommunityIDs);
      console.log("Community Following IDs:", followingCommunityIDs);

    } catch (error) {
      console.error("Error fetching communities:", error);
      setErrorMessage("Failed to load your communities.");
    }
  };

  // Update global posts when the "explore-posts" tab is set to active
  useEffect(() => {
    if (currentTab === "explore-posts") {
      fetchPosts();
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === "community-posts") {
      fetchCommunityPosts();
    }
  }, [currentTab]);

  // Update user following posts when the "user-posts" tab is set to active
  // And when posts changes
  useEffect(() => {
    if (currentTab === "user-posts") {
      if (posts.length > 0 && userFollowing.length > 0) {
        // Filter by following IDs
        const filteredPosts = posts.filter((post) => userFollowing.includes(post.user));
        setUserPosts(filteredPosts);
        console.log("User Posts:", userPosts);
      }
    }
  }, [currentTab, posts, userFollowing]);

  // Fetch community posts on community-posts tab
  useEffect(() => {
    if (currentTab === "community-posts") {
      if (communityPosts.length > 0 && userCommunities.length > 0) {
        // Filter by community IDs
        const filteredPosts = communityPosts.filter((communityPost) => userCommunities.includes(communityPost.community));
        setFilteredCommunityPosts(filteredPosts);
      }
    }
  }, [currentTab, communityPosts, userCommunities]);

  useEffect(() => {
    fetchPosts();
    fetchCommunityPosts();
    fetchFollowingList();
    fetchCommunityList();
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
      setPosts(updatedPosts);
      fetchCommunityPosts();
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
      setNewComment({ ...newComment, [postId]: "" });
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

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

                  <p>{post.post_text}</p>

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
                        {post.comments.slice(0, 3).map((comment) => (
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

                  <p>{userPost.post_text}</p>

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
                        {userPost.comments.slice(0, 3).map((comment) => (
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
          {filteredCommunityPosts.length === 0 ? (
            <p>No posts in the community posts feed yet. Try joining a community!</p>
          ) : (
            filteredCommunityPosts.map((filteredCommunityPost) => (
              <div
                key={filteredCommunityPost.id}
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
                          onClick={() => navigate(`/communities/${filteredCommunityPost.community}`)}
                      >
                          {filteredCommunityPost.community_name}
                      </span>
                      <p className="text-muted fst-italic">by {" "}
                        <span 
                        className="text-muted fst-italic cursor-pointer text-decoration-underline"
                        style={{ cursor: 'pointer' }} 
                        onClick={() => navigate(`/profile/${filteredCommunityPost.user}`)}
                        >
                          {filteredCommunityPost.user_name} {filteredCommunityPost.user_last_name}
                        </span>
                      </p>
                    </div>
                    <div style={{ color: "#777", fontSize: "12px" }}>
                      {new Date(filteredCommunityPost.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <p>{filteredCommunityPost.post_text}</p>

                {filteredCommunityPost.image_url && (
                  <img
                    src={filteredCommunityPost.image_url}
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
                      backgroundColor: filteredCommunityPost.liked_by_user ? "#e0f7fa" : "#f1f1f1",
                      color: filteredCommunityPost.liked_by_user ? "#007BFF" : "#555",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: 500,
                    }}
                    onClick={() => handleLikeToggle(filteredCommunityPost.id)}
                  >
                    <ThumbsUp size={20} /> {filteredCommunityPost.liked_by_user ? "Liked" : "Like"}
                  </button>
                  <span style={{ color: "#555", fontSize: "14px" }}>
                    {filteredCommunityPost.like_count} {filteredCommunityPost.like_count === 1 ? "Like" : "Likes"}
                  </span>
                </div>

                {/* Comments Section */}
                <div className="comment-section">
                  <h6>Comments</h6>
                  {filteredCommunityPost.comments?.length > 0 ? (
                    <ul className="list-unstyled">
                      {filteredCommunityPost.comments.slice(0, 3).map((comment) => (
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
                  onSubmit={(e) => handleCommentSubmit(e, filteredCommunityPost.id)}
                  className="d-flex mt-2"
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write a comment..."
                    value={newComment[filteredCommunityPost.id] || ""}
                    onChange={(e) =>
                      setNewComment({ ...newComment, [filteredCommunityPost.id]: e.target.value })
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

