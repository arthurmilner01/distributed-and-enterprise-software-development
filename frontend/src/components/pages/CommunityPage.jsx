

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, useNavigate } from "react-router-dom";
import useApi from "../../api";
import { useAuth } from "../../context/AuthContext";

import { Button, Modal, Form, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import PinnedPostsComponent from "../widgets/PinnedPostsComponent";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Standard Datepicker CSS
import Post from "../widgets/Post";
import PaginationComponent from "../widgets/PaginationComponent";
import CreatePost from "../widgets/CreatePost";


const CommunityPage = () => {
  const { communityId } = useParams();
  const { user, accessToken } = useAuth();
  const api = useApi();
  const navigate = useNavigate();

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
    keywords: "",
  });
  

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementError, setAnnouncementError] = useState("");
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementContent, setNewAnnouncementContent] = useState("");

  // Posts state
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState({});
  const [newPostImage, setNewPostImage] = useState(null);


  // For pagination of posts
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  const [eventDate, setEventDate] = useState(null);
  const [eventType, setEventType] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventErrorMessage, setEventErrorMessage] = useState(""); // Error specific to event modal
  const [expandedEventId, setExpandedEventId] = useState(null); // Track expanded event
  const [eventCapacity, setEventCapacity] = useState('');
  // State for Editing Events
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // Store the whole event object being edited
  const [editEventErrorMessage, setEditEventErrorMessage] = useState(""); // Error specific to edit modal
  // State for the edit form fields (initialized when modal opens)
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDescription, setEditEventDescription] = useState("");
  const [editEventDate, setEditEventDate] = useState(null);
  const [editEventType, setEditEventType] = useState("");
  const [editEventLocation, setEditEventLocation] = useState("");
  const [editEventCapacity, setEditEventCapacity] = useState('');
  const currentUserMembership = communityMembers.find(member => member.id === user?.id);
  // Check if their role in this community is 'EventManager'
  const isCurrentUserEventManager = currentUserMembership?.role === "EventManager";

  const [isMembersOnly, setIsMembersOnly] = useState(false);


   const handlePageChange = useCallback((newPage) => {
            setCurrentPage(newPage);
    }, []); 

  const fetchCommunityMembers = async () => {
    try {
      const res = await api.get(`/api/community/members/?community_id=${community.id}`);
      setCommunityMembers(res.data);
    } catch (err) {
      console.error("Failed to load community members", err);
    }
  };

  useEffect(() => {
    if (community?.id) { // If community ID is passed
      fetchCommunityMembers();
      if (isLeader){
        fetchFollowRequests(); // For showing follow request count to leaders
      }
    }
  }, [community?.id]); // When community ID changes

  useEffect(() => {
    if (eventType === 'webinar' || eventType === 'meeting') {
      setEventLocation("Online (Zoom link will be auto-generated)");
    } else {
      setEventLocation("");
    }
  }, [eventType]);

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
      const communityData = response.data; // Defined within try block

      if (!communityData) {
          throw new Error("Received invalid community data from API.");
      }

      setCommunity(communityData);

      setEditData({
        community_name: communityData.community_name || "",
        description: communityData.description || "",
        rules: communityData.rules || "",
        privacy: communityData.privacy || "public",
        keywords: (communityData.keyword_list || []).join(', '),
      });

      // --- CORRECTED LOG: Use communityData here ---
      console.log("Community Response:", communityData);
      setErrorMessage(""); // Clear error on success

    } catch (error) {
      // --- CORRECTED LOG: Log the actual error object ---
      console.error("Error fetching community:", error);
      // --- END CORRECTION ---
      setErrorMessage("Failed to load community details.");
      setCommunity(null); // Explicitly set community to null on error
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
  const fetchCommunityPosts = async (page = 1) => {
    try {
      const response = await api.get("api/posts/community", {
        params: { 
          community_id: communityId,
          page: page
         },
      });
      const data = response.data.results ? response.data.results : response.data;
      setPosts(Array.isArray(data) ? data : []);
      setCurrentPage(response.data.current_page || 1);
      setTotalPages(response.data.total_pages || 1);
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
      // Parses ISO 8601 strings used to sort the events
      const sortedEvents = (response.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setErrorMessage("Failed to load community events.");
    }
  };


  const handleDeleteCommunity = async (communityId) => {
    try {
      const response = await api.delete(`/api/communities/${communityId}/`);
      setSuccessMessage("Community has been deleted, redirecting to communities dashboard...")
      setErrorMessage("")
      setTimeout(() => {
        navigate("/communities");
      }, 2000);
    } catch (error) {
      console.error("Error deleting community:", error.response?.data || error.message);
      setErrorMessage(`Error deleting community: ${error.response?.data?.error || error.message}`);
    }
  };

  // Fetch once we have a communityId (and user) e.g. on page load
  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchAnnouncements();
      fetchCommunityPosts(currentPage);
      fetchPinnedPosts();
      fetchEvents();
      if (user) {
        fetchMembership();
        fetchUserCommunityRequests();
      }
    }
  }, [communityId, user, isMember, isRequested]);

  useEffect(() => {
    fetchCommunityPosts(currentPage); // Fetch posts based on currentPage
  }, [currentPage]); // When page changes

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
    const keywordsArray = (editData.keywords || "") 
    .split(',')
    .map(kw => kw.trim())
    .filter(kw => kw !== '');

    try {
      await api.patch(`api/communities/${communityId}/`, {
        community_name: editData.community_name,
        description: editData.description,
        rules: editData.rules,
        privacy: editData.privacy,
        keywords: keywordsArray,

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
  
    // Prevent empty posts
    if (!newPost.trim() && !newPostImage) {
      setErrorMessage("Please add text, an image, or a video before posting.");
      return;
    }
  
    const formData = new FormData();
    formData.append("post_text", newPost);
  
    if (newPostImage) {
      formData.append("image", newPostImage);
    }
  
    if (communityId) {
      formData.append("community", parseInt(communityId));
    }
  
    formData.append("is_members_only", isMembersOnly);
  
    try {
      const response = await api.post("api/posts/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Update posts visually and set states to null
      setPosts((prev) => [response.data, ...prev]);
      setNewPost("");
      setNewPostImage(null);
      setIsMembersOnly(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      setErrorMessage("Failed to create post.");
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


      // Refresh community details if you have this function
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
      fetchCommunityPosts(currentPage);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      // Send DELETE request
      const response = await api.delete(`/api/posts/${postId}/`);
  
      // Update the state to reflect the deleted post
      setCurrentPage(1); // Just in-case post is last on a page
      fetchCommunityPosts(currentPage);
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
      fetchCommunityPosts(currentPage);
      setNewComment({ ...newComment, [postId]: "" });
    } catch (error) {
      console.error("Failed to create comment:", error);
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
    setEventCapacity(''); 
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

    let formattedTimestamp; // Use a name indicating time is included
    try {
      // Use toISOString() to send the full timestamp
      formattedTimestamp = eventDate.toISOString();
    } catch (dateError) {
      console.error("Invalid date/time selected:", eventDate);
      setEventErrorMessage("Invalid date/time selected. Please choose a date and time.");
      return;
    }
    const capacityValue = eventCapacity === '' ? null : parseInt(eventCapacity, 10);

    // Basic validation for capacity if needed (e.g., ensure it's a positive number if not null)
    if (capacityValue !== null && (isNaN(capacityValue) || capacityValue < 1)) {
         setEventErrorMessage("Capacity must be a positive number if provided.");
         return;
    }

    try {
      await api.post("/api/events/", {
        event_name: eventTitle,
        description: eventDescription,
        // Send the full timestamp
        date: formattedTimestamp,
        event_type: eventType,
        location: eventLocation,
        capacity: capacityValue,
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
    // Convert the ISO date string back to a Date object for DatePicker
    setEditEventDate(eventToEdit.date ? new Date(eventToEdit.date) : null);
    setEditEventType(eventToEdit.event_type || "");
    setEditEventLocation(eventToEdit.location || "");
    setEditEventCapacity(eventToEdit.capacity ?? '');

    setEditEventErrorMessage(""); // Clear previous errors
    setIsEditEventModalOpen(true); // Open the modal
  };

  const handleCloseEditEventModal = () => {
    setIsEditEventModalOpen(false);
    setEditingEvent(null); // Clear the event being edited
    setEditEventErrorMessage(""); // Clear errors
    setEditEventCapacity('');
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
    const capacityValue = editEventCapacity === '' ? null : parseInt(editEventCapacity, 10);
    if (capacityValue !== null && (isNaN(capacityValue) || capacityValue < 1)) {
         setEditEventErrorMessage("Capacity must be a positive number if provided.");
         return;
    }

    // Prepare the data payload - only send fields that can be updated
    const updatedEventData = {
      event_name: editEventTitle,
      description: editEventDescription,
      date: formattedTimestamp,
      event_type: editEventType,
      location: editEventLocation,
      capacity: capacityValue,
   
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
  const handleRSVPUpdate = async (eventId, status) => {
      setSuccessMessage(""); // Clear previous messages
      setErrorMessage("");

      try {
          console.log(`Sending RSVP for Event ${eventId} with status: ${status}`); // Debug log
          // Use POST to the new endpoint
          const response = await api.post(`/api/events/${eventId}/rsvp/`, { status });

          console.log("RSVP Response:", response.data); // Debug log
          setSuccessMessage(`Your RSVP has been updated to ${status}.`);

          // Refetch events to update the counts and button states
          fetchEvents();

      } catch (error) {
          console.error("Error updating RSVP:", error);
          // Display specific backend errors if available (like capacity full)
          setErrorMessage(error.response?.data?.detail || error.response?.data?.error || "Failed to update RSVP.");
          setSuccessMessage(""); // Clear success message on error
      } finally {
      }
  };

  const renderLocationWithLinks = (locationText) => {
    //Check if the text contains a Zoom link
    if (locationText.includes('Zoom Link:')) {
      //Split the text by 'Zoom Link:' to separate the location from the link
      const [locationPart, linkPart] = locationText.split('Zoom Link:');
      
      return (
        <>
          {locationPart}
          <strong>Zoom Link: </strong>
          <a 
            href={linkPart.trim()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary"
          >
            Join Meeting
          </a>
        </>
      );
    }
    
    //If no Zoom link is found just return the text
    return locationText;
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
              <div className="mb-3">
              <label className="form-label">Keywords (Comma-separated)</label>
              <textarea
                  name="keywords" // Matches the key in editData
                  className="form-control"
                  rows="2" // Adjust rows as needed
                  value={editData.keywords} // Bind to the keywords string in editData state
                  onChange={handleEditChange} // Use the existing general input handler
                  placeholder="Enter keywords separated by commas (e.g., python, web dev, projects)"
              />
               <small className="text-muted">
                  Separate each keyword or phrase with a comma.
              </small>
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
              <div className="mb-3">
              <strong>Keywords:</strong>
              {community.keyword_list && community.keyword_list.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1 mt-1">
                      {community.keyword_list.map((keyword, index) => (
                          <span key={index} className="badge bg-secondary">{keyword}</span>
                      ))}
                  </div>
              ) : (
                  <span className="text-muted ms-2">No keywords added.</span>
              )}
          </div>
              
              {isLeader && (
                <p className="text-primary" style={{ cursor: "pointer", textDecoration: "none" }} onClick={openFollowRequestsModal}>
                  Approve/deny join requests ({followRequests.length})
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

              {isLeader && (
                <Button variant="danger" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
                    handleDeleteCommunity(communityId);
                  }
                }}
                className="mx-2">
                  Delete Community
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
                fetchCommunityPosts(currentPage);
              }}
              communityId={communityId}
              onReorder={() => {
                fetchPinnedPosts();
                fetchCommunityPosts(currentPage);
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
            <div className="card-header bg-light-subtle text-white">
              <h4 className="mb-3 text-primary">Community Posts</h4>
              <CreatePost
                newPost={newPost}
                setNewPost={setNewPost}
                newPostImage={newPostImage}
                setNewPostImage={setNewPostImage}
                handlePostSubmit={handlePostSubmit}
                isMembersOnly={isMembersOnly}
                setIsMembersOnly={setIsMembersOnly}
              />
            </div>
            <div className="card-body">
              {posts.length > 0 ? (
                posts.map((post) => (
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
                    isLeader={isLeader}
                    isPostPinned={isPostPinned}
                    fetchPinnedPosts={fetchPinnedPosts}
                    fetchCommunityPosts={fetchCommunityPosts}
                    communityId={communityId}
                  />
                ))
              ) : (
                <p>No posts yet.</p>
              )}
              {/* Pagination Component */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <PaginationComponent currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
                </div>
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
                  {events.map((event) => {
                    // --- ADD: Helper variables for clarity ---
                    const isEventManagerOrLeader = isLeader || isCurrentUserEventManager; // Combine check
                    const isEventPast = new Date(event.date) < new Date();
                    const currentUserStatus = event.current_user_rsvp_status;
                    // --- END ADD ---

                    return ( 
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
                               {/* Edit/Delete Buttons (Existing Logic) */}
                               {isEventManagerOrLeader && !isEventPast && ( // Also hide edit/delete for past events
                                   <>
                                       <button className="btn btn-outline-primary btn-sm me-2 p-1" onClick={() => handleEditEventClick(event)} title="Edit Event">Edit</button>
                                       <button className="btn btn-outline-danger btn-sm me-2 p-1" onClick={() => handleDeleteEventClick(event.id)} title="Delete Event">Delete</button>
                                   </>
                               )}
                               {/* Expand/Collapse Button (Existing) */}
                               <button className="btn btn-link btn-sm p-1 text-secondary" onClick={() => toggleEventDetails(event.id)} aria-expanded={expandedEventId === event.id} aria-controls={`event-details-${event.id}`} title="Toggle Details">
                                   {expandedEventId === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                   <span className="visually-hidden">Toggle details</span>
                               </button>
                           </div>
                       </div>

                       {/* Collapsible Event Details */}
                       <div id={`event-details-${event.id}`} className={`mt-2 small collapse ${expandedEventId === event.id ? 'show' : ''}`}>
                           <p className="mb-1"><strong>Description:</strong> {event.description || <span className="text-muted">N/A</span>}</p>
                           <p className="mb-1"><strong>Type:</strong> <span className="text-capitalize">{event.event_type || "N/A"}</span></p>
                           <p className="mb-1">
                              <strong>Location/Platform:</strong>{" "}
                              {event.location ? (
                                renderLocationWithLinks(event.location)
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </p>

                           {/* --- ADDED: Capacity Info --- */}
                           {isEventManagerOrLeader && event.capacity != null && (
                               <p className="mb-1">
                                   <strong>Capacity:</strong> {event.rsvp_accepted_count ?? 0} / {event.capacity} accepted
                               </p>
                           )}
                           {/* --- END ADDED: Capacity Info --- */}
                       </div>

                       {/* --- ADDED: RSVP Section --- */}
                       {/* Only show RSVP section for members and if event is not past */}
                       {isMember && !isEventPast && ( // Assuming `isMember` checks if the user is part of the *community*
                           <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
                               <small className="text-muted me-2 fw-bold">Your RSVP:</small>
                               <div className="btn-group btn-group-sm" role="group" aria-label="RSVP status">
                                   <button type="button"
                                           className={`btn ${currentUserStatus === 'Accepted' ? 'btn-success' : 'btn-outline-success'}`}
                                           onClick={() => handleRSVPUpdate(event.id, 'Accepted')} /* Add handler later */ >
                                       Accept
                                   </button>
                                   <button type="button"
                                           className={`btn ${currentUserStatus === 'Tentative' ? 'btn-warning text-dark' : 'btn-outline-warning'}`} /* Added text-dark for better contrast */
                                           onClick={() => handleRSVPUpdate(event.id, 'Tentative')} /* Add handler later */ >
                                       Maybe
                                   </button>
                                   <button type="button"
                                           className={`btn ${currentUserStatus === 'Declined' ? 'btn-danger' : 'btn-outline-danger'}`}
                                           onClick={() => handleRSVPUpdate(event.id, 'Declined')} /* Add handler later */ >
                                       Decline
                                   </button>
                               </div>
                           </div>
                       )}
                        {/* Show simple status if event is past */}
                        {isMember && isEventPast && (
                           <div className="mt-2 pt-2 border-top">
                               <small className="text-muted fw-bold me-2">Your RSVP:</small>
                               {currentUserStatus ? (
                                   <span className={`badge ${currentUserStatus === 'Accepted' ? 'bg-success' : currentUserStatus === 'Declined' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                       {currentUserStatus} (Past)
                                   </span>
                               ) : (
                                    <span className="badge bg-secondary">Event Past</span>
                               )}
                           </div>
                        )}
                       {/* --- END ADDED: RSVP Section --- */}
                   </li>
                    ); 
                  })}
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

      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)} centered>
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

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
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





      <Modal show={requestModalShowHide} onHide={closeFollowRequestsModal} centered>
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
                    <Link to={`/profile/${request.user_details.id}`} className="text-decoration-none" onClick={closeFollowRequestsModal}>
                      <strong>{request.user_details.first_name} </strong>
                      <strong>{request.user_details.last_name}</strong>
                    </Link>
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
      {/* Create Event Modal */}
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
                timeIntervals={15}           // Set time interval to every 15 mins
                placeholderText="Select event date and time" // Updated placeholder
                className="form-control"
                wrapperClassName="d-block"
                required
                autoComplete="off"
              />
              <Form.Text muted> Only today/future dates and times can be selected. </Form.Text>
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
              <Form.Control
                type="text"
                placeholder="e.g., Online (Zoom Link), Main Hall"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                required
                disabled={eventType === 'webinar' || eventType === 'meeting'}
              />
              {eventType === 'webinar' || eventType === 'meeting' && (
                <Form.Text className="text-muted">
                  This event will automatically generate a Zoom meeting link.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="eventCapacity">
                    <Form.Label>Capacity (Optional)</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Max attendees (leave blank for unlimited)"
                        value={eventCapacity} // Use state variable 'eventCapacity'
                        onChange={(e) => setEventCapacity(e.target.value)} // Use state setter 'setEventCapacity'
                        min="1" // Optional: prevent negative numbers or zero
                    />
                    <Form.Text muted>
                        Leave blank if there is no limit on attendees.
                    </Form.Text>
                </Form.Group>


          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={closeEventModal}> Close </Button>
            <Button variant="primary" type="submit"> Create Event </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      {/* Edit Event Modal */}
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
            <Form.Group className="mb-3" controlId="editEventCapacity">
                    <Form.Label>Capacity (Optional)</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Max attendees (leave blank for unlimited)"
                        value={editEventCapacity} // Use state variable 'editEventCapacity'
                        onChange={(e) => setEditEventCapacity(e.target.value)} // Use state setter 'setEditEventCapacity'
                        min="1"
                    />
                     <Form.Text muted>
                        Leave blank if there is no limit on attendees.
                    </Form.Text>
                </Form.Group>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={handleCloseEditEventModal}> Cancel </Button>
            {/* Submit button triggers handleUpdateEvent */}
            <Button variant="primary" type="submit"> Save Changes </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default CommunityPage;
