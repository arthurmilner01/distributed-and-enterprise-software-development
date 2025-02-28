import { useAuth } from "../../context/AuthContext";
import { useState } from "react"; 
import { Edit, Check, X } from "lucide-react";
import axios from "axios";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";

const ProfilePage = () => {
  const { user, isAuthenticated, accessToken } = useAuth();
  const [currentTab, setCurrentTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("")

  //For pre-populating edit fields and for sending in API request
  const [editableUser, setEditableUser] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    bio: user?.bio || "",
    interests: user?.interests || "",
  });

  if (!isAuthenticated || !user) {
    return <p>Loading profile data...</p>;
  }

  //When user is changing details update editableUser
  const handleInputChange = (e) => {
    setEditableUser({ ...editableUser, [e.target.name]: e.target.value });
  };

  //When user saves changes (API Call)
  const handleSaveChanges = async () => {
    //Make API call to update and then update access token with new details
    try {
      const response = await axios.patch(`http://localhost:8000/user/update/${user.id}/`, editableUser, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });

      setIsEditing(false);
      setErrorMessage("");
      //TODO: Update access token so reflects users details

      setSuccessMessage("Profile successfully updated.");
    } 
    catch (error) 
    {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setSuccessMessage("");
    }
  };

  //When user cancels changes, reset fields to actual values
  const handleCancel = () => {
    setEditableUser({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      bio: user.bio || "",
      interests: user.interests || "",
    });
    setIsEditing(false);
  };

  //Using isEditing to show/hide edit fields
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-3 text-center">
          <img
            src={user.profile_picture || default_profile_picture}
            alt="Profile"
            className="img-fluid rounded-circle border border-3 text-info"
            style={{ width: "200px", height: "200px" }}
          />
        </div>

        <div className="col-md-9">
          <div className="d-flex flex-column justify-content-center">
            <h2 className="mt-4">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="first_name"
                    value={editableUser.first_name}
                    onChange={handleInputChange}
                    className="form-control d-inline w-auto"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={editableUser.last_name}
                    onChange={handleInputChange}
                    className="form-control d-inline w-auto ms-2"
                  />
                </>
              ) : (
                <>
                  {user.first_name || "Unknown"} {user.last_name || "Unknown"}
                </>
              )}
              
              {!isEditing && (
                <button
                  className="btn text-info p-0 ms-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={25} />
                </button>
              )}
            </h2>

            <p className="text-muted">{user.email || "Unknown"}</p>
            <hr />

            <div className="mb-3">
              <h4>Bio</h4>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editableUser.bio}
                  onChange={handleInputChange}
                  className="form-control"
                />
              ) : (
                <p>{user.bio || "User has not provided a bio..."}</p>
              )}
            </div>

            <div className="mb-3">
              <h4>Interests</h4>
              {isEditing ? (
                <textarea
                  name="interests"
                  value={editableUser.interests}
                  onChange={handleInputChange}
                  className="form-control"
                />
              ) : (
                <p>{user.interests || "User has not provided any interests..."}</p>
              )}
            </div>

            {errorMessage && <p className="text-danger">{errorMessage}</p>}
            {successMessage && <p className="text-success">{successMessage}</p>}

            {isEditing && (
              <div className="d-flex gap-2 mt-2 mb-3">
                <button className="btn btn-success" onClick={handleSaveChanges}>
                  <Check size={20} /> Confirm
                </button>
                <button className="btn btn-danger" onClick={handleCancel}>
                  <X size={20} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="nav nav-pills mb-3 d-flex justify-content-center" id="profile-tabs" role="tab-list">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "posts" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("posts")}
          >
            Posts
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "communities" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("communities")}
          >
            Communities
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${currentTab === "events" ? "active bg-info" : "text-dark"}`}
            onClick={() => setCurrentTab("events")}
          >
            Events
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {currentTab === "posts" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">User Posts</h5>
                <p className="card-text">User posts here...</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === "communities" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">User Communities</h5>
                <p className="card-text">User's communities here...</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === "events" && (
          <div className="tab-pane fade show active">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Upcoming Events</h5>
                <p className="card-text">Upcoming events here...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
