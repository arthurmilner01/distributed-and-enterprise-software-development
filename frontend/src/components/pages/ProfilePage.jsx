import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react"; 
import { Edit, Check, X } from "lucide-react";
import default_profile_picture from "../../assets/images/default_profile_picture.jpg";
import useApi from "../../api"; 
import { useParams } from "react-router-dom";

//TODO: Edit profile picture/upload

const ProfilePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { userId } = useParams(); // Get userId from URL
  //For whether or not editing options are shown
  //Edits are still validated in backend so not a problem just hiding the buttons here
  const isOwner = user.id === parseInt(userId);
  const [currentTab, setCurrentTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const api = useApi();
  const [fetchedUser, setFetchedUser] = useState(null);
  const [editableUser, setEditableUser] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    interests: "",
    profile_picture: "",
  });
  const [isConfirmed, setIsConfirmed] = useState(false); //For updating details on profile update

  //Fetching user details from the api using ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
          const response = await api.get(`user/${userId}/`);
          setFetchedUser(response.data);
          //Only update if not updating details
          setEditableUser({
            id: response.data.id,
            first_name: response.data.first_name || "Unknown",
            last_name: response.data.last_name || "Unknown",
            bio: response.data.bio || "This user hasn't added a bio...",
            interests: response.data.interests || "This user hasn't added any interests...",
            profile_picture: response.data.profile_picture || default_profile_picture
          });
      } catch (error) {
        console.error("Error fetching user data:", error);
        //If error in response display them
        if (error.response && error.response.data && error.response.data.error) {
          setErrorMessage(error.response.data.error);
        } else {
          setErrorMessage("Failed to load user data.");
        }
      }
    };
    if (userId) {
      setErrorMessage("");
      //If not editing
      if(!isEditing || isConfirmed)
      {
        fetchUserData();
        if(isConfirmed) {
          setIsConfirmed(false); //Set confirmed back to false
        }  
      }
    }

  }, [userId, isConfirmed]);

  //If user doesn't exist
  if (!fetchedUser) {
    return (
      <div>
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      </div>
    );
  }
  

  //When the user edits profile details
  const handleInputChange = (e) => {
    setEditableUser({ ...editableUser, [e.target.name]: e.target.value });
  };

  //When user confirms
  const handleSaveChanges = async () => {
    //Have to use FormData because of profile picture
    const updatedUser = new FormData();
    // Append the text fields
    updatedUser.append('first_name', editableUser.first_name);
    updatedUser.append('last_name', editableUser.last_name);
    updatedUser.append('bio', editableUser.bio);
    updatedUser.append('interests', editableUser.interests);
    //If profile picture has been updated
    if (editableUser.profile_picture && editableUser.profile_picture !== default_profile_picture) {
      updatedUser.append('profile_picture', editableUser.profile_picture);
    }

    try {
      const response = await api.patch(`user/update/${userId}/`, updatedUser);
      setErrorMessage("");
      setSuccessMessage("Profile successfully updated.");
      setIsEditing(false);
      setIsConfirmed(true); //To run new fetch user details
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setSuccessMessage("");
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    setEditableUser({
      first_name: fetchedUser.first_name || "Unknown",
      last_name: fetchedUser.last_name || "Unknown",
      bio: fetchedUser.bio || "This user hasn't added a bio...",
      interests: fetchedUser.interests || "This user hasn't added any interests...",
      profile_picture: fetchedUser.profile_picture || default_profile_picture,
    });
    setIsEditing(false);
    setSuccessMessage("");
    setErrorMessage("Profile update cancelled.");
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-3 text-center">
          <img
            src={editableUser.profile_picture}
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
                  {fetchedUser.first_name || "Unknown"} {fetchedUser.last_name || "Unknown"}
                </>
              )}
              
              {isOwner && !isEditing && (
                <button
                  className="btn text-info p-0 ms-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={25} />
                </button>
              )}
            </h2>

            <p className="text-muted">{fetchedUser.email || "Unknown"}</p>
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
                <p>{fetchedUser.bio || "User has not provided a bio..."}</p>
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
                <p>{fetchedUser.interests || "User hasn't provided any interests..."}</p>
              )}
            </div>

            {errorMessage && <p className="text-danger">{errorMessage}</p>}
            {successMessage && <p className="text-success">{successMessage}</p>}

            {isOwner && isEditing && (
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