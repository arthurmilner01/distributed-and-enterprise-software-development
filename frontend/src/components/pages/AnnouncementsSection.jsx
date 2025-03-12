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
  const [announcements, setAnnouncements] = useState([]);
  const [announcementError, setAnnouncementError] = useState("");
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");

  // Fetch community details
  const fetchCommunity = async () => {
    try {
      // Calls /api/communities/:id/
      const response = await api.get(`api/communities/${communityId}/`);
      setCommunity(response.data);
    } catch (error) {
      console.error("Error fetching community:", error);
      setErrorMessage("Failed to load community details.");
    }
  };

  // Fetch announcements for the community
  const fetchAnnouncements = async () => {
    try {
      // Calls /api/announcements/?community_id=:id
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

  // Check if the current user is the community leader
  const isLeader = community?.is_community_owner === user?.id;

  // Handle posting a new announcement (leader-only)
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setAnnouncementError("");
    try {
      // Calls POST /api/announcements/
      await api.post("api/announcements/", {
        community_id: communityId,
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
      });
      setNewAnnouncementTitle("");
      setNewAnnouncementContent("");
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      console.error("Error creating announcement:", error);
      setAnnouncementError("Failed to create announcement.");
    }
  };

  return (
    <div className="container mt-5">
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      {community ? (
        <div className="card shadow-sm">
          <div className="card-body">
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

            <hr />
            <h4>Announcements</h4>
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
      ) : (
        <p>Loading community...</p>
      )}
    </div>
  );
};

export default CommunityPage;
