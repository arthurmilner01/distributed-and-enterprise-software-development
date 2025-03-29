

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Pin,PlusCircle  } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useParams } from "react-router-dom";
import useApi from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Button, Modal } from "react-bootstrap";
import { Form, Alert } from "react-bootstrap";
import axios from "axios";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import PinnedPostsComponent from "../widgets/PinnedPostsComponent";
import PostPinButton from "../ui/PinPostButton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Standard Datepicker CSS

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

  //Pinned posts State
  const [pinnedPosts, setPinnedPosts] = useState([]);

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

  // For changing user roles within a communtity 
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedMember, setSelectedMember] = useState("");

  //  Event State Variables
  const [events, setEvents] = useState([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState(null); // Use null for Date object state
  const [eventType, setEventType] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventErrorMessage, setEventErrorMessage] = useState(""); // Error specific to event modal
  const [expandedEventId, setExpandedEventId] = useState(null); // Track expanded event
  // --- State for Editing Events ---
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // Store the whole event object being edited
  const [editEventErrorMessage, setEditEventErrorMessage] = useState(""); // Error specific to edit modal
  // State for the edit form fields (initialized when modal opens)
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDescription, setEditEventDescription] = useState("");
  const [editEventDate, setEditEventDate] = useState(null);
  const [editEventType, setEditEventType] = useState("");
  const [editEventLocation, setEditEventLocation] = useState("");
  const currentUserMembership = communityMembers.find(member => member.id === user?.id);
  // Check if their role in this community is 'EventManager' (Case-sensitive!)
  const isCurrentUserEventManager = currentUserMembership?.role === "EventManager";


  // --- END State for Editing Events ---
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
  const fetchEvents = async () => {
    try {
      const response = await api.get(`/api/events/`, { params: { community_id: communityId } });
      // new Date() correctly parses ISO 8601 strings (like "2025-04-03T10:30:00Z")
      const sortedEvents = (response.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setErrorMessage("Failed to load community events.");
    }
  };

  // Fetch once we have a communityId (and user) e.g. on page load
  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchAnnouncements();
      fetchCommunityPosts();
      fetchPinnedPosts();
      fetchEvents();
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

  // Create role update for user 
  const handleRoleUpdate = async () => {
    try {
      await api.post(`/api/communities/${community.id}/update-role/`, {
        user_id: selectedUserId,
        role: selectedRole,
      });

      setSuccessMessage("Role updated!");
      setShowRoleModal(false);
      fetchCommunityMembers(); // Refresh roles

    } catch (error) {
      console.error("Error updating role:", error);
      setErrorMessage("Failed to update role.");
      console.log("Member Roles:", communityMembers);

    }
  };



  // Fetches all pinned posts
  const fetchPinnedPosts = async () => {
    try {
      const response = await api.get(`api/pinnedposts/`, {
        params: { community_id: communityId }
      });
      setPinnedPosts(response.data);
    } catch (error) {
      console.error("Error fetching pinned posts:", error);
    }
  };

  // Helper func to check if a post is marked as pinned or not
  const isPostPinned = (postId) => {
    return pinnedPosts.some(pinnedPost => pinnedPost.post_id === postId);
  };
  const openEventModal = () => {
    setIsEventModalOpen(true);
    setEventErrorMessage(""); // Clear previous event modal errors
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    // Reset form fields
    setEventTitle("");
    setEventDescription("");
    setEventDate(null);
    setEventType("");
    setEventLocation("");
    setEventErrorMessage(""); // Clear error on close
  };

  const toggleEventDetails = (eventId) => {
    setExpandedEventId(prevId => (prevId === eventId ? null : eventId));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventErrorMessage("");
    setSuccessMessage("");
    setErrorMessage("");

    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventType || !eventLocation.trim()) {
        setEventErrorMessage("Please fill in all required event details.");
        return;
    }

    // --- CHANGE THIS PART BACK ---
    let formattedTimestamp; // Use a name indicating time is included
    try {
        // Use toISOString() to send the full timestamp
        formattedTimestamp = eventDate.toISOString();
    } catch (dateError) {
        console.error("Invalid date/time selected:", eventDate);
        setEventErrorMessage("Invalid date/time selected. Please choose a date and time.");
        return;
    }
    // --- END CHANGE ---

    try {
      await api.post("/api/events/", {
        event_name: eventTitle,
        description: eventDescription,
        // --- CHANGE THIS PART BACK: Send the full timestamp ---
        date: formattedTimestamp,
        // --- END CHANGE ---
        event_type: eventType,
        location: eventLocation,
        community: parseInt(communityId),
      });
      setSuccessMessage("Event created successfully!");
      closeEventModal();
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      let errorMsg = "Failed to create event.";
       // Your existing error handling...
       if (error.response) {
            if (error.response.status === 403) { errorMsg = "Permission Denied."; }
            else if (error.response.data) {
                const errors = error.response.data;
                if (errors.date && Array.isArray(errors.date)) { errorMsg = `Creation failed: date: ${errors.date.join(' ')}`; } // Handles potential backend date format errors again
                else if (typeof errors === 'object' && errors !== null) { errorMsg = Object.entries(errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; '); }
                else if (typeof errors === 'string') { errorMsg = errors.detail || errors.error || errors; }
                else { errorMsg = "Please check form details."; }
                if (!errorMsg.toLowerCase().startsWith('creation failed:')) { errorMsg = `Creation failed: ${errorMsg}`; }
            }
       }
      setEventErrorMessage(errorMsg);
      setSuccessMessage("");
    }
  };
   // Opens the Edit Modal and pre-fills form state
   const handleEditEventClick = (eventToEdit) => {
    if (!eventToEdit) return;
    setEditingEvent(eventToEdit); // Store the event being edited

    // Pre-fill the edit form state
    setEditEventTitle(eventToEdit.event_name || "");
    setEditEventDescription(eventToEdit.description || "");
    // IMPORTANT: Convert the ISO date string back to a Date object for DatePicker
    setEditEventDate(eventToEdit.date ? new Date(eventToEdit.date) : null);
    setEditEventType(eventToEdit.event_type || "");
    setEditEventLocation(eventToEdit.location || "");

    setEditEventErrorMessage(""); // Clear previous errors
    setIsEditEventModalOpen(true); // Open the modal
  };

  const handleCloseEditEventModal = () => {
    setIsEditEventModalOpen(false);
    setEditingEvent(null); // Clear the event being edited
    setEditEventErrorMessage(""); // Clear errors
    // Optionally reset edit form fields (though they get reset on open)
    // setEditEventTitle(""); ... etc.
  };

  // Handles the submission of the Edit Event form
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setEditEventErrorMessage(""); // Clear previous modal error
    setSuccessMessage("");
    setErrorMessage("");

    if (!editingEvent) {
      setEditEventErrorMessage("Error: No event selected for editing.");
      return;
    }

    // Validation for edit form fields
    if (!editEventTitle.trim() || !editEventDescription.trim() || !editEventDate || !editEventType || !editEventLocation.trim()) {
        setEditEventErrorMessage("Please fill in all required event details.");
        return;
    }

    let formattedTimestamp;
    try {
        formattedTimestamp = editEventDate.toISOString();
    } catch (dateError) {
        setEditEventErrorMessage("Invalid date/time selected.");
        return;
    }

    // Prepare the data payload - only send fields that can be updated
    const updatedEventData = {
        event_name: editEventTitle,
        description: editEventDescription,
        date: formattedTimestamp,
        event_type: editEventType,
        location: editEventLocation,
        // Include community ID if your PATCH/PUT endpoint requires it
        // community: parseInt(communityId),
    };

    try {
      // Use PATCH for partial updates, PUT if replacing the whole resource
      await api.patch(`/api/events/${editingEvent.id}/`, updatedEventData);
      setSuccessMessage("Event updated successfully!");
      handleCloseEditEventModal(); // Close modal on success
      fetchEvents(); // Refresh the events list
    } catch (error) {
      console.error("Error updating event:", error);
      let errorMsg = "Failed to update event.";
       // Consistent error handling
       if (error.response) {
            if (error.response.status === 403) { errorMsg = "Permission Denied."; }
            else if (error.response.data) {
                const errors = error.response.data;
                if (errors.date && Array.isArray(errors.date)) { errorMsg = `Update failed: date: ${errors.date.join(' ')}`; }
                else if (typeof errors === 'object' && errors !== null) { errorMsg = Object.entries(errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; '); }
                else if (typeof errors === 'string') { errorMsg = errors.detail || errors.error || errors; }
                else { errorMsg = "Please check form details."; }
                if (!errorMsg.toLowerCase().startsWith('update failed:')) { errorMsg = `Update failed: ${errorMsg}`; }
            }
       }
      setEditEventErrorMessage(errorMsg); // Show error in the edit modal
      setSuccessMessage("");
    }
  };

  // Handles clicking the delete button
  const handleDeleteEventClick = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
        return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    try {
        await api.delete(`/api/events/${eventId}/`);
        setSuccessMessage("Event deleted successfully!");
        fetchEvents(); // Refresh the list
    } catch (error) {
        console.error("Error deleting event:", error);
        setErrorMessage(error.response?.data?.detail || error.response?.data?.error || "Failed to delete event.");
    }
  };
  // --- END Event Edit/Delete Handlers ---

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
              {isLeader && (
                <Button variant="secondary" onClick={() => setShowRoleModal(true)} className="mx-2">
                  Manage Roles
                </Button>
              )}




            </>
          )}
        </div>
      </div>

      {/* If public or user is a real member (Leader or Member), show announcements & posts */}
      {community.privacy === "public" || (community.privacy === "private" && isMember) ? (
        <>

          {/* Pinned Posts Section - only visible if public or user is a member */}
          {community.privacy === "public" || (community.privacy === "private" && isMember) ? (
            <PinnedPostsComponent 
              pinnedPosts={pinnedPosts}
              isLeader={isLeader}
              onUnpin={() => {
                fetchPinnedPosts();
                fetchCommunityPosts();
              }}
              communityId={communityId}
              onReorder={() => {
                fetchPinnedPosts();
                fetchCommunityPosts();
              }} 
            />
          ) : null}

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
                      {/* Pinned & Like*/}
                      <h5>
                        {post.user_name} {post.user_last_name}
                        {isPostPinned(post.id) && (
                          <span className="badge bg-warning ms-2">
                            <Pin size={12} className="me-1" />
                            Pinned
                          </span>
                        )}
                      </h5>

                      {isLeader && (
                        <PostPinButton 
                          post={post}
                          communityId={communityId}
                          isPinned={isPostPinned(post.id)}
                          onPinStatusChange={() => {
                            fetchPinnedPosts();
                            fetchCommunityPosts();
                          }}
                        />
                      )}
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
                              {/* === Community Events Section  === */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0 h5">Community Events</h4>
              {/* Create Event Button (Visible to Leader OR EventManagers) */}
              {/* Ensure the condition matches how roles are stored on your user object */}
              {(isLeader || isCurrentUserEventManager) && (
                <Button
                variant="light" // Keep light variant for contrast on green
                size="sm"
                onClick={openEventModal}
                className="d-flex align-items-center" // Use flexbox for icon alignment
            >
                <PlusCircle size={16} className="me-1" /> {/* Icon added */}
                Create Event
            </Button>
               )}
            </div>
            <div className="card-body">
              {events.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {events.map((event) => (
                    <li key={event.id} className="list-group-item px-0 py-3">
                       <div className="d-flex justify-content-between align-items-center">
                            {/* Event Name and Date */}
                            <div>
                                <h5 className="mb-1 h6">{event.event_name}</h5>
                                <small className="text-muted">
                                    {new Date(event.date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                </small>
                            </div>
                             {/* Button Group for Actions */}
                             <div className="d-flex align-items-center flex-shrink-0">
                                
                                {/* Check if Leader OR if specifically EventManager for *this* community */}
                                {(isLeader || isCurrentUserEventManager) && (
                                    <>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2 p-1"
                                            onClick={() => handleEditEventClick(event)}
                                            aria-label={`Edit event ${event.event_name}`}
                                            title="Edit Event"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="me-2 p-1"
                                            onClick={() => handleDeleteEventClick(event.id)}
                                            aria-label={`Delete event ${event.event_name}`}
                                            title="Delete Event"
                                        >
                                             Delete
                                        </Button>
                                    </>
                                )}
                                
                                {/* Expand/Collapse Button */}
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => toggleEventDetails(event.id)}
                                    aria-expanded={expandedEventId === event.id}
                                    aria-controls={`event-details-${event.id}`}
                                    className="p-1 text-secondary" // Subtle style
                                    title="Toggle Details" // Tooltip
                                >
                                    {expandedEventId === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    <span className="visually-hidden">Toggle details</span>
                                </Button>
                            </div>
                        </div>

                        {/* Collapsible Event Details */}
                        <div
                            id={`event-details-${event.id}`}
                            className={`mt-2 small collapse ${expandedEventId === event.id ? 'show' : ''}`}
                         >
                            <p className="mb-1"><strong>Description:</strong> {event.description || <span className="text-muted">N/A</span>}</p>
                            <p className="mb-1"><strong>Type:</strong> <span className="text-capitalize">{event.event_type || "N/A"}</span></p>
                            <p className="mb-0"><strong>Location/Platform:</strong> {event.location || <span className="text-muted">N/A</span>}</p>
                        </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 // Message when no events exist
                 <p className="text-muted text-center">There are no upcoming events scheduled for this community.</p>
              )}
            </div>
          </div>
          {/* === END Community Events Section === */}
        </>
      ) : (
        <div className="alert alert-warning">
          <strong>This is a private community.</strong> Announcements , posts and events are visible only to members.
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

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a member and their new role:</p>

          <div className="mb-3">
            <label>User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select Member --</option>
              {communityMembers
                .filter((member) => member.role?.toLowerCase() !== "leader") // filter out leader
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} ({member.role || "No Role"})
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Role</label>
            <select
              className="form-control"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">-- Select Role --</option>
              <option value="Member">Member</option>
              <option value="Moderator">Moderator</option>
              <option value="EventManager">Event Manager</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRoleUpdate} disabled={!selectedUserId || !selectedRole}>
            Update Role
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
      {/* === ADD Create Event Modal HERE === */}
      <Modal show={isEventModalOpen} onHide={closeEventModal} centered>
        <Modal.Header closeButton>
             <Modal.Title className="h5">Create a New Community Event</Modal.Title>
         </Modal.Header>
         {/* Use react-bootstrap Form */}
         <Form onSubmit={handleCreateEvent}>
            <Modal.Body>
                {/* Display event-specific error message */}
                {eventErrorMessage && <Alert variant="danger">{eventErrorMessage}</Alert>}

                <Form.Group className="mb-3" controlId="eventTitle">
                    <Form.Label>Event Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" placeholder="e.g., Annual Tech Meetup" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="eventDescription">
                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control as="textarea" placeholder="Provide details about the event..." value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={3} required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="eventDate">
                    
                    <Form.Label>Date & Time <span className="text-danger">*</span></Form.Label>
                    <DatePicker
                        selected={eventDate}
                        onChange={(date) => setEventDate(date)}
                        minDate={new Date()} // Still disable past dates
                        showTimeSelect                // Enable time selection
                        timeInputLabel="Time:"        // Label for time input
                        dateFormat="MMMM d, yyyy h:mm aa" // Display format with time (e.g., March 29, 2025 5:30 PM)
                        timeIntervals={15}           // Optional: Set time intervals (e.g., every 15 mins)
                        placeholderText="Select event date and time" // Updated placeholder
                        className="form-control"
                        wrapperClassName="d-block"
                        required
                        autoComplete="off"
                    />
                     <Form.Text muted> Only today/future dates and times can be selected. </Form.Text> {/* Updated text */}
                </Form.Group>

                <Form.Group className="mb-3" controlId="eventType">
                    <Form.Label>Event Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={eventType} onChange={(e) => setEventType(e.target.value)} required>
                        <option value="">-- Select Type --</option>
                        <option value="conference">Conference</option>
                        <option value="workshop">Workshop</option>
                        <option value="webinar">Webinar</option>
                        <option value="social">Social Gathering</option>
                        <option value="meeting">Meeting</option>
                        <option value="competition">Competition</option>
                        <option value="other">Other</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="eventLocation">
                     <Form.Label>Location / Platform <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" placeholder="e.g., Online (Zoom Link), Main Hall" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} required />
                </Form.Group>

            </Modal.Body>
             <Modal.Footer>
                 <Button variant="secondary" type="button" onClick={closeEventModal}> Close </Button>
                 <Button variant="primary" type="submit"> Create Event </Button>
            </Modal.Footer>
        </Form>
      </Modal>
     {/* === END Create Event Modal === */}
     {/* ===  Edit Event Modal HERE === */}
     <Modal show={isEditEventModalOpen} onHide={handleCloseEditEventModal} centered>
        <Modal.Header closeButton>
             <Modal.Title className="h5">Edit Event</Modal.Title>
         </Modal.Header>
         {/* Pass handleUpdateEvent to Form onSubmit */}
         <Form onSubmit={handleUpdateEvent}>
            <Modal.Body>
                {/* Display edit-specific error message */}
                {editEventErrorMessage && <Alert variant="danger">{editEventErrorMessage}</Alert>}

                {/* Form fields pre-filled from editEvent state */}
                <Form.Group className="mb-3" controlId="editEventTitle">
                    <Form.Label>Event Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)} required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="editEventDescription">
                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control as="textarea" value={editEventDescription} onChange={(e) => setEditEventDescription(e.target.value)} rows={3} required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="editEventDate">
                    <Form.Label>Date & Time <span className="text-danger">*</span></Form.Label>
                    <DatePicker
                        selected={editEventDate} // Use editEventDate state
                        onChange={(date) => setEditEventDate(date)} // Update editEventDate state
                        minDate={new Date()}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MMMM d, yyyy h:mm aa"
                        timeIntervals={15}
                        placeholderText="Select event date and time"
                        className="form-control"
                        wrapperClassName="d-block"
                        required
                        autoComplete="off"
                    />
                     <Form.Text muted> Only today/future dates and times can be selected. </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="editEventType">
                    <Form.Label>Event Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select value={editEventType} onChange={(e) => setEditEventType(e.target.value)} required>
                       <option value="">-- Select Type --</option>
                       <option value="conference">Conference</option>
                       <option value="workshop">Workshop</option>
                       <option value="webinar">Webinar</option>
                       <option value="social">Social Gathering</option>
                       <option value="meeting">Meeting</option>
                       <option value="competition">Competition</option>
                       <option value="other">Other</option>
                   </Form.Select>
               </Form.Group>

               <Form.Group className="mb-3" controlId="editEventLocation">
                    <Form.Label>Location / Platform <span className="text-danger">*</span></Form.Label>
                   <Form.Control type="text" value={editEventLocation} onChange={(e) => setEditEventLocation(e.target.value)} required />
               </Form.Group>

           </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" type="button" onClick={handleCloseEditEventModal}> Cancel </Button>
                {/* Submit button triggers handleUpdateEvent */}
                <Button variant="primary" type="submit"> Save Changes </Button>
           </Modal.Footer>
       </Form>
     </Modal>
     {/* === END Edit Event Modal === */}
      
    </div>
  );
};

export default CommunityPage;
