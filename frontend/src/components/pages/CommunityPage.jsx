import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../api";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const CommunityPage = () => {
  const { communityId } = useParams();
  const { user, accessToken, isAuthenticated, loading} = useAuth();
  const api = useApi();

  const [community, setCommunity] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // State for editing community details
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    community_name: "",
    description: "",
    rules: "",
    privacy: "public",
  });
  console.log("communityId:", communityId); // Debug

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementError, setAnnouncementError] = useState("");
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");

  // Dummy posts state (frontend only)
  const [posts, setPosts] = useState([]);

  // Fetch posts for the current community
  const fetchCommunityPosts = async () => {
    try {
      const response = await api.get(`api/posts/`, {
        params: { community: communityId }, // Filter by community ID
      });
  
      console.log("DEBUG - Posts fetched from API:", response.data);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching community posts:", error);
    }
  };
  
  // Fetch posts when the community ID changes
  useEffect(() => {
    if (communityId) {
      fetchCommunityPosts();
    }
  }, [communityId]);
  
  
  // Fetch posts when the community ID changes
  useEffect(() => {
    if (communityId) {
      fetchCommunityPosts();
    }
  }, [communityId]);
  

  // New states for post modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState("");

  // Fetch community details
  const fetchCommunity = async () => {
    try {
      const response = await api.get(`api/communities/${communityId}/`);
      setCommunity(response.data);
      setEditData({
        community_name: response.data.community_name || "",
        description: response.data.description || "",
        rules: response.data.rules || "",
        privacy: response.data.privacy || "public",
      });
    } catch (error) {
      console.error("Error fetching community:", error);
      setErrorMessage("Failed to load community details.");
    }
  };

  // Fetch announcements for the community
  const fetchAnnouncements = async () => {
    try {
      const response = await api.get(`api/announcements/?community_id=${communityId}`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncementError("Failed to load announcements.");
    }
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchAnnouncements();
    }
  }, [communityId]);

  // Check if current user is the community leader
  const isLeader = community?.is_community_owner === user?.id;

  // Handlers for editing community details
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveCommunity = async () => {
    setErrorMessage("");
    try {
      await api.patch(`api/communities/${communityId}/`, {
        community_name: editData.community_name,
        description: editData.description,
        rules: editData.rules,
        privacy: editData.privacy,
      });
      setIsEditing(false);
      fetchCommunity();
    } catch (error) {
      console.error("Error updating community:", error);
      setErrorMessage("Failed to update community details.");
    }
  };

  // Handler for announcement submission (leader-only)
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setAnnouncementError("");
    try {
      await api.post("api/announcements/", {
        community_id: communityId,
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
      });
      setNewAnnouncementTitle("");
      setNewAnnouncementContent("");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      setAnnouncementError("Failed to create announcement.");
    }
  };

  // Updated handler for post submission to send the post to the current community
  const handlePostSubmit = async (event) => {
    event.preventDefault();
  
    axios
      .post(
        "http://localhost:8000/api/posts/",
        { post_text: newPost, community: parseInt(communityId) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then((response) => {
        setPosts([response.data, ...posts]); // Add new post to the top of the list
        setNewPost("");
        setIsModalOpen(false);
      })
      .catch((error) => {
        console.error("Failed to create post:", error);
      });
  };
  
  
  
  




  return (
    <div className="container mt-5">
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      {community ? (
        <>
          {/* Community Details Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Community Details</h3>
            </div>
            <div className="card-body">
              {isEditing ? (
                <div>
                  <div className="mb-3">
                    <label className="form-label">Community Name</label>
                    <input
                      type="text"
                      name="community_name"
                      className="form-control"
                      value={editData.community_name}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="2"
                      value={editData.description}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rules</label>
                    <textarea
                      name="rules"
                      className="form-control"
                      rows="2"
                      value={editData.rules}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Privacy</label>
                    <select
                      name="privacy"
                      className="form-select"
                      value={editData.privacy}
                      onChange={handleEditChange}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <button className="btn btn-success me-2" onClick={handleSaveCommunity}>
                    Save Changes
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="card-title">{community.community_name}</h2>
                  <p className="card-text">
                    <strong>Description:</strong> {community.description}
                  </p>
                  <p className="card-text">
                    <strong>Rules:</strong> {community.rules}
                  </p>
                  <p className="card-text">
                    <strong>Privacy:</strong> {community.privacy}
                  </p>
                  {isLeader && (
                    <button className="btn btn-primary" onClick={handleEditClick}>
                      Edit Community
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Announcements Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">Announcements</h4>
            </div>
            <div className="card-body">
              {announcementError && (
                <div className="alert alert-danger">{announcementError}</div>
              )}
              {announcements.length > 0 ? (
                <ul className="list-group mb-3">
                  {announcements.map((ann) => (
                    <li key={ann.id} className="list-group-item">
                      <strong>{ann.title}</strong>: {ann.content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No announcements yet.</p>
              )}

              {isLeader && (
                <div className="mt-3">
                  <h5>Post a New Announcement</h5>
                  <form onSubmit={handleAnnouncementSubmit}>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Announcement Title"
                        value={newAnnouncementTitle}
                        onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        placeholder="Announcement Content"
                        value={newAnnouncementContent}
                        onChange={(e) => setNewAnnouncementContent(e.target.value)}
                        rows="3"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Post Announcement
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Posts Section */}
          <div className="card shadow-sm mb-4">
          <div className="card-header bg-secondary text-white">
            <h4 className="mb-0">Community Posts</h4>
          </div>
          <div className="card-body">
            {/* Button to open the post creation modal */}
            <button
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
              onClick={() => setIsModalOpen(true)}
            >
              Create Post
            </button>

            {posts && posts.length > 0 ? (
              <ul className="list-group mt-3">
                {posts.map((post) => (
                  <li key={post.id} className="list-group-item d-flex align-items-start">
                    {/* User Profile Image */}
                    <img
                      src={post.user_image || default_profile_picture } // Fallback profile image
                      alt="User Avatar"
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginRight: "15px",
                        border: "2px solid #ddd",
                      }}
                    />

                    {/* Post Content */}
                    <div style={{ flex: 1 }}>
                      <h5>{post.user_name} {post.user_last_name}</h5>
                      <p>{post.post_text}</p>
                      <small>{new Date(post.created_at).toLocaleDateString()}</small>
                    </div>

                    {/* Like Button */}
                    <button
                      className="btn btn-outline-danger"
                      style={{ marginLeft: "auto" }}
                    >
                      ❤️ {post.likes}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No posts yet.</p>
            )}
          </div>
        </div>


          {/* Modal for creating a new post */}
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
        </>
      ) : (
        <p>Loading community...</p>
      )}
    </div>
  );
};

export default CommunityPage;
