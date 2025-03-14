import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../api";

const CommunitiesDashboard = () => {
  const [userCommunities, setUserCommunities] = useState([]);
  const [userRequestCommunities, setUserRequestCommunities] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = useApi();

  // Fetch the communities for the current user
  const fetchCommunities = async () => {
    try {
      const response = await api.get(`api/communityfollow/user_communities_list`);
      setUserCommunities(response.data);
    } catch (error) {
      console.error("Error fetching communities:", error);
      setErrorMessage("Failed to load your communities.");
    }
  };

  // Fetch users outgoing community requests
  const fetchUserCommunityRequests = async () => {
    try {
        const response = await api.get("api/communityfollow/follow_requests/");
        setUserRequestCommunities(response.data);
    } catch (error) {
        console.error("Error fetching communities:", error);
        setErrorMessage("Failed to load requested communities.");
    }
  }
  
  // Leave community
  const handleUnfollow = async (communityId) => {
    try {
      const response = await api.delete(`api/communityfollow/unfollow/`, {
        params: { community_id: communityId }
      });
      setSuccessMessage("Successfully left the community.");
      setErrorMessage("");
      fetchCommunities(); 
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

  // Cancel join request
  const handleCancelRequest = async (communityId) => {
    try {
      const response = await api.delete(`api/communityfollow/cancel_follow_request/`, {
        params: { community_id: communityId }
      });
      setSuccessMessage("Join request cancelled successfully.");
      setErrorMessage("");
      fetchCommunities();
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

  // Get users communities and requests to join communitites
  useEffect(() => {
    if (user?.id) {
      fetchCommunities();
      fetchUserCommunityRequests();
    }
  }, [user]);

  // Handle navigation to create-community page
  const handleCreateCommunity = () => {
    navigate("/create-community");
  };

  // Navigate to discover community page
  const navigateDiscover = () => {
    navigate("/communities/discover");
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Your Communities</h3>

              {/* Display error if any */}
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              )}

              {/* Communities List */}
              {userCommunities.length > 0 ? (
                <ul className="list-group mb-3">
                  {userCommunities.map((uc) => (
                    <li key={uc.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span
                        className="text-primary text-decoration-underline"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/communities/${uc.community_id}`)}
                      >
                        {uc.community_name}
                      </span>
                      <span className="badge bg-info text-white">{uc.role}</span>
                      <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleUnfollow(uc.community_id)}
                      >
                        Leave
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>You are not in any communities yet.</p>
              )}
              <hr></hr>
              <h5 className="text-center mb-4 small-title">Community Requests</h5>
              {userRequestCommunities.length > 0 ? (
                <div>
                  <ul className="list-group mb-3">
                    {userRequestCommunities.map((ucr) => (
                      <li key={ucr.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span
                        className="text-primary text-decoration-underline"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/communities/${ucr.id}`)}
                        >
                          {ucr.community_name}
                        </span>
                        <span className="badge bg-warning text-white">Requested</span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelRequest(ucr.id)}
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted text-grey text-center fst-italic">You have no outgoing join requests.</p>
              )}

              {/* Button to go to CreateCommunityPage */}
              <button className="btn btn-info w-100 text-white mt-2" onClick={handleCreateCommunity}>
                Create Community
              </button>
              <button className="btn btn-info w-100 mt-2 text-white" onClick={navigateDiscover}>
                Discover New Communities
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitiesDashboard;
