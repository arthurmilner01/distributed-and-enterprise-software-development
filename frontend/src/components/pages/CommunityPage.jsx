import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../api";
import { useAuth } from "../../context/AuthContext";

const CommunityPage = () => {
  const { communityId } = useParams();
  const { user } = useAuth();
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

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementError, setAnnouncementError] = useState("");
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");

  // Dummy posts state (frontend only)
  const [posts] = useState([
    { id: 1, title: "Welcome!", content: "This is the first post in our community." },
    { id: 2, title: "Upcoming Event", content: "Don't miss our event next week." },
  ]);

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

          {/* Posts Section (Frontend Only) */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-secondary text-white">
              <h4 className="mb-0">Community Posts</h4>
            </div>
            <div className="card-body">
              {posts && posts.length > 0 ? (
                <ul className="list-group">
                  {posts.map((post) => (
                    <li key={post.id} className="list-group-item">
                      <h5>{post.title}</h5>
                      <p>{post.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No posts yet.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>Loading community...</p>
      )}
    </div>
  );
};

export default CommunityPage;
