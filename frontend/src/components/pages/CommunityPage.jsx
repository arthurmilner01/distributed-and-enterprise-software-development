import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle } from 'lucide-react';
import { useParams } from "react-router-dom";
import useApi from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const CommunityPage = () => {
  const { communityId } = useParams();
  const { user, accessToken } = useAuth();
  const api = useApi();

  // Community details
  const [community, setCommunity] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Editing community details
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

  // Posts state
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState("");

  // Whether the current user is actually a member (or leader)
  const [isMember, setIsMember] = useState(false);
  // Whether the current user has requested to join the community
  const [isRequested, setIsRequested] = useState(false);

  // For show/hide of request modal
  const [requestModalShowHide, setRequestModalShowHide] = useState(false);
  // For storing follow requests of community
  const [followRequests, setFollowRequests] = useState([])
  // Error/success message for modal
  const [requestErrorMessage, setRequestErrorMessage] = useState("")
  const [requestSuccessMessage, setRequestSuccessMessage] = useState("")

  // For transfer ownership modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [communityMembers, setCommunityMembers] = useState([]);

  const fetchCommunityMembers = async () => {
    try {
      const res = await api.get(`/api/community/members/?community_id=${community.id}`);
      setCommunityMembers(res.data);
    } catch (err) {
      console.error("Failed to load community members", err);
    }
  };

  useEffect(() => {
    if (community?.id) {
      fetchCommunityMembers();
    }
  }, [community?.id]);



  // To control modal show/hide
  const openFollowRequestsModal = () => {
    if (isLeader) {
      // Get follow request for the community
      fetchFollowRequests();
      // Open follow requests modal
      setRequestModalShowHide(true);
    }
  };

  const closeFollowRequestsModal = () => {
    setRequestModalShowHide(false);
  };

  // Fetch follow requests for this community (backend has community leader check)
  const fetchFollowRequests = async () => {
    try {
      const response = await api.get(`api/communityfollow/follow_requests_for_community/`, {
        params: { community_id: communityId }
      });
      console.log("Community Requests Response:", response.data);

      setFollowRequests(response.data);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Failed to get follow requests.");
      }
    }
  };

  // Deny join request
  const handleDenyRequest = async (requestId) => {
    try {
      const response = await api.delete(`api/communityfollow/deny_follow_request/`, {
        params: { request_id: requestId }
      });
      setRequestErrorMessage("");
      setRequestSuccessMessage("Follow request denied.");
      fetchFollowRequests();
    } catch (error) {
      console.error("Error denying join request:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setRequestErrorMessage(error.response.data.error);
      } else {
        setRequestErrorMessage("Failed to deny the join request. Please try again.");
      }
      setRequestSuccessMessage(""); // Reset success message on error
    }
  };

  // Approve join request
  const handleApproveRequest = async (requestId) => {
    try {
      const response = await api.delete(`api/communityfollow/approve_follow_request/`, {
        params: { request_id: requestId }
      });
      setRequestErrorMessage("");
      setRequestSuccessMessage("Follow request approved.");
      fetchFollowRequests();
    } catch (error) {
      console.error("Error approving join request:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setRequestErrorMessage(error.response.data.error);
      } else {
        setRequestErrorMessage("Failed to approve the join request. Please try again.");
      }
      setRequestSuccessMessage(""); // Reset success message on error
    }
  };

  // 1) Fetch community details
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
      console.log("Community Response:", response.data);
    } catch (error) {
      console.error("Error fetching community:", error);
      setErrorMessage("Failed to load community details.");
    }
  };

  // 2) Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await api.get(`api/announcements/?community_id=${communityId}`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncementError("Failed to load announcements.");
    }
  };

  // 3) Fetch posts for this community
  const fetchCommunityPosts = async () => {
    try {
      const response = await api.get("api/posts/", {
        params: { community: communityId },
      });
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching community posts:", error);
    }
  };

  // 4) Determine if the current user is a member or leader
  const fetchMembership = async () => {
    try {
      const response = await api.get("api/communityfollow/followers/");
      console.log("Request response", response);
      // Search if viewed community id is found in community request data for logged in user
      const isFollowedCommunity = response.data.some(community => {
        return parseInt(community.id) === parseInt(communityId);
      });
      console.log("User follows community?", isFollowedCommunity);
      setIsMember(isFollowedCommunity);
    } catch (error) {
      console.error("Error fetching communiy requests:", error);
      setErrorMessage("Failed to fetch users community requests.");
    }
  };

  // 5) Fetch users outgoing community requests
  const fetchUserCommunityRequests = async () => {
    try {
      const response = await api.get("api/communityfollow/follow_requests/");
      console.log("Request response", response);
      // Search if viewed community id is found in community request data for logged in user
      const isRequestedCommunity = response.data.some(community => {
        return parseInt(community.id) === parseInt(communityId);
      });
      console.log("User has outgoing request?", isRequestedCommunity);
      setIsRequested(isRequestedCommunity);
    } catch (error) {
      console.error("Error fetching communiy requests:", error);
      setErrorMessage("Failed to fetch users community requests.");
    }
  }

  // Fetch once we have a communityId (and user) e.g. on page load
  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchAnnouncements();
      fetchCommunityPosts();
      if (user) {
        fetchMembership();
        fetchUserCommunityRequests();
      }
    }
  }, [communityId, user, isMember, isRequested]);

  // Is the current user the leader?
  const isLeader = community?.is_community_owner === user?.id;

  // Editing logic
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Updating edit states according to user input
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // When saving community edits/creation
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

  // Leader-only announcements
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

  // Create new post
  const handlePostSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/posts/",
        { post_text: newPost, community: parseInt(communityId) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setPosts((prev) => [response.data, ...prev]);
      setNewPost("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  // Leave community
  const handleLeaveCommunity = async (communityId) => {
    try {
      // Unfollows community
      const response = await api.delete(`api/communityfollow/unfollow/`, {
        params: { community_id: communityId }
      });
      setSuccessMessage("Successfully left the community.");
      setErrorMessage("");
      // Refresh memberships
      fetchMembership();
      fetchUserCommunityRequests();
    } catch (error) {
      console.error("Error unfollowing community:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Failed to leave the community. Please try again.");
      }

      setSuccessMessage("");
    }
  };

  // Join a community
  const handleJoinCommunity = async (communityId) => {
    try {
      const response = await api.post(`api/communityfollow/follow/`, { community_id: communityId });
      setSuccessMessage("Successfully joined the community.");
      setErrorMessage("");
      // Refresh user community data
      fetchMembership();
      fetchUserCommunityRequests();
    } catch (error) {
      console.error("Error joining community:", error);
      setErrorMessage("Failed to join community. Please try again.");
      setSuccessMessage("");
    }
  };

  // Request to join a private community
  const handleRequestToJoin = async (communityId) => {
    try {
      const response = await api.post(`api/communityfollow/request_follow/`, { community_id: communityId });
      setSuccessMessage("Request to join the community sent.");
      setErrorMessage("");
      // Refresh user community data
      fetchMembership();
      fetchUserCommunityRequests();
    } catch (error) {
      console.error("Error requesting to join community:", error);
      setErrorMessage("Failed to request to join the community. Please try again.");
      setSuccessMessage("");
    }
  };
  const handleTransferOwnership = async () => {
    if (!selectedUserId) {
      alert("Please select a new owner.");
      return;
    }

    try {
      await api.post(`/api/communities/${community.id}/transfer-ownership/`, {
        new_owner_id: selectedUserId,
      });

      setSuccessMessage("Ownership transferred successfully.");
      setShowTransferModal(false);
      window.location.reload();


      // Optional: refresh community details if you have this function
      if (typeof fetchCommunityDetails === "function") {
        fetchCommunityDetails();
      }

    } catch (error) {
      console.error("Transfer failed:", error);
      setErrorMessage("Failed to transfer ownership.");
    }
  };

  // Cancel join request
  const handleCancelRequest = async (communityId) => {
    try {
      const response = await api.delete(`api/communityfollow/cancel_follow_request/`, {
        params: { community_id: communityId }
      });
      setSuccessMessage("Join request cancelled successfully.");
      setErrorMessage("");
      // Refresh memberships
      fetchMembership();
      fetchUserCommunityRequests();
    } catch (error) {
      console.error("Error canceling join request:", error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("Failed to cancel the join request. Please try again.");
      }
      setSuccessMessage(""); // Reset success message on error
    }
  };


  if (!community) {
    return (
      <div className="container mt-5">
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        <p>Loading community...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

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
              <p className="text-muted">Members: {community.member_count}</p>
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
                <p className="text-primary" style={{ cursor: "pointer", textDecoration: "none" }} onClick={openFollowRequestsModal}>
                  Approve/deny join requests
                </p>
              )}
              {isLeader && (
                <button className="btn btn-primary" onClick={handleEditClick}>
                  Edit Community
                </button>
              )}

              {isMember ? (
                <Button
                  onClick={() => handleLeaveCommunity(community.id)}
                  variant="danger"
                  className="mx-2"
                >
                  Leave Community
                </Button>
              ) : isRequested ? (
                <Button onClick={() => handleCancelRequest(community.id)} variant="danger">
                  Cancel Request
                </Button>
              ) : community.privacy === "public" ? (
                <Button onClick={() => handleJoinCommunity(community.id)} variant="primary">
                  Join
                </Button>
              ) : (
                <Button onClick={() => handleRequestToJoin(community.id)} variant="warning">
                  Request to Join
                </Button>
              )
              }
              {isLeader && (
                <button className="btn btn-warning" onClick={() => setShowTransferModal(true)}>
                  Transfer Ownership
                </button>
              )}


            </>
          )}
        </div>
      </div>

      {/* If public or user is a real member (Leader or Member), show announcements & posts */}
      {community.privacy === "public" || (community.privacy === "private" && isMember) ? (
        <>
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
              <button
                className="btn btn-primary mb-3"
                onClick={() => setIsModalOpen(true)}
              >
                Create Post
              </button>
              {posts && posts.length > 0 ? (
                <ul className="list-group">
                  {posts.map((post) => (
                    <li key={post.id} className="list-group-item d-flex align-items-start">
                      <img
                        src={post.user_image || default_profile_picture}
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
                      <div style={{ flex: 1 }}>
                        <h5>
                          {post.user_name} {post.user_last_name}
                        </h5>
                        <p>{post.post_text}</p>
                        <small>{new Date(post.created_at).toLocaleDateString()}</small>
                      </div>
                      <button className="btn btn-outline-danger" style={{ marginLeft: "auto" }}>
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
        </>
      ) : (
        <div className="alert alert-warning">
          <strong>This is a private community.</strong> Announcements and posts are visible only to members.
        </div>
      )}

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
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Ownership</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a new community leader:</p>
          <select
            className="form-control"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">-- Select Member --</option>
            {communityMembers
              .filter((member) => member.id !== user.id)
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTransferOwnership} disabled={!selectedUserId}>
            Confirm Transfer
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={requestModalShowHide} onHide={closeFollowRequestsModal}>
        <Modal.Header closeButton>
          <Modal.Title>Follow Requests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {followRequests.length > 0 ? (
            <ul className="list-group">
              {followRequests.map((request) => (
                <li key={request.id} className="list-group-item d-flex align-items-center justify-content-between">
                  <img
                    src={request.user_details.profile_picture || default_profile_picture}
                    alt="Profile"
                    className="rounded-circle me-2"
                    style={{ width: "50px", height: "50px", margin: "10px" }}
                  />
                  <div>
                    <strong>{request.user_details.first_name} </strong>
                    <strong>{request.user_details.last_name}</strong>
                  </div>
                  <div>
                    <Button
                      className="btn btn-success me-2"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      <CheckCircle size={20} />
                    </Button>

                    <Button
                      className="btn btn-danger"
                      onClick={() => handleDenyRequest(request.id)}
                    >
                      <XCircle size={20} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No follow requests at the moment.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {requestErrorMessage && <div className="alert alert-danger">{requestErrorMessage}</div>}
          {requestSuccessMessage && <div className="alert alert-success">{requestSuccessMessage}</div>}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CommunityPage;
