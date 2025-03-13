import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../api";

const CommunitiesDashboard = () => {
  const [userCommunities, setUserCommunities] = useState([]);
  const [userRequestCommunities, setUserRequestCommunities] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = useApi();

  // Fetch the communities for the current user
  const fetchCommunities = async () => {
    try {
      const response = await api.get(`api/user-communities/?user_id=${user.id}`);
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

              {/* Communities List */}
              {userCommunities.length > 0 ? (
                <ul className="list-group mb-3">
                  {userCommunities.map((uc) => (
                    <li key={uc.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{uc.community_name}</span>
                      <span className="badge bg-info text-white">{uc.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>You are not in any communities yet.</p>
              )}
              <hr></hr>
              <h3 className="text-center mb-4">Community Requests</h3>
              {userRequestCommunities.length > 0 ? (
                <div>
                  <ul className="list-group mb-3">
                    {userRequestCommunities.map((uc) => (
                      <li key={uc.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{uc.community_name}</span>
                        <span className="badge bg-info text-white">Requested</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted">You have no outgoing join requests.</p>
              )}

              {/* Button to go to CreateCommunityPage */}
              <button className="btn btn-info w-100 text-white" onClick={handleCreateCommunity}>
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
