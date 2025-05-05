import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import useApi from '../../api'; // Adjust path if needed
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Alert, Button, Spinner } from 'react-bootstrap'; // Using react-bootstrap components explicitly
// Import icons if desired for buttons/status
// import { Check, X, HelpCircle } from 'lucide-react';

const EventDashboardPage = () => {
    const { isAuthenticated, user } = useAuth();
    const api = useApi();
    const navigate = useNavigate(); // Initialize navigate

    const [userRsvps, setUserRsvps] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading for the main list
    const [errorMessage, setErrorMessage] = useState(''); // General page errors
    const [successMessage, setSuccessMessage] = useState(''); // For RSVP update success
    const [updatingRsvpId, setUpdatingRsvpId] = useState(null); // Track which RSVP is being updated

    const fetchUserRsvps = async () => { // Function defined directly
        // Prevent fetching if not authenticated or user object isn't loaded yet
        if (!isAuthenticated || !user) {
             setUserRsvps([]); // Clear if not logged in
             setIsLoading(false); // Ensure loading stops
             return;
        }
        setIsLoading(true);
        setErrorMessage(''); // Clear previous errors on fetch start
        try {
            // Use the api instance available from component scope
            const response = await api.get('/api/my-rsvps/');
            setUserRsvps(response.data || []);
        } catch (error) {
            console.error("Error fetching user RSVPs:", error);
            setErrorMessage("Could not load your event RSVPs.");
            setUserRsvps([]);
        } finally {
            setIsLoading(false);
        }
    }; 
// useEffect to fetch RSVPs when authentication status changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserRsvps(); // Call fetch directly
        } else {
            setUserRsvps([]); // Clear RSVPs if logged out
        }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAuthenticated, user?.id]); // Depend ONLY on auth status and user ID
// Adding api here could still cause loops if useApi isn't stable
    // Handler for updating RSVP status
    const handleRSVPUpdate = async (eventId, status) => {
        setUpdatingRsvpId(eventId); // Show loading on the specific button set
        setSuccessMessage(""); // Clear previous messages
        setErrorMessage("");

        try {
            await api.post(`/api/events/${eventId}/rsvp/`, { status });
            setSuccessMessage(`RSVP updated to ${status}.`);
            // Refetch the entire list to get updated data from backend
            // This ensures counts and statuses are accurate across the board
            await fetchUserRsvps(); // Wait for refetch to complete

        } catch (error) {
            console.error("Error updating RSVP:", error);
            // Display specific backend errors if available
            setErrorMessage(error.response?.data?.detail || error.response?.data?.error || "Failed to update RSVP.");
            setSuccessMessage(""); // Clear success message on error
        } finally {
             setUpdatingRsvpId(null); // Clear loading indicator for this event
        }
    };

    // --- Render Helper for RSVP Buttons ---
    // This function remains inside the component as it depends on state/handlers
    const renderRsvpControls = (rsvp) => {
        const event = rsvp.event;
        if (!event) return null;

        const isEventPast = new Date(event.date) < new Date();
        const currentStatus = rsvp.status;
        const isLoadingRsvp = updatingRsvpId === event.id;

        if (isEventPast) {
            return (
                // Displaying past status using Bootstrap Badges
                 <span className={`badge ${
                     currentStatus === 'Accepted' ? 'bg-secondary'
                     : currentStatus === 'Declined' ? 'bg-light text-muted border'
                     : 'bg-light text-secondary border' // Tentative or no status
                 }`}>
                    {currentStatus ? `${currentStatus} (Past)` : 'Event Past'}
                 </span>
            );
        }

        // Active event RSVP controls using React-Bootstrap Buttons
        return (
            <div className="btn-group btn-group-sm" role="group" aria-label="Update RSVP status">
                <Button
                    variant={currentStatus === 'Accepted' ? 'success' : 'outline-success'}
                    onClick={() => handleRSVPUpdate(event.id, 'Accepted')}
                    disabled={isLoadingRsvp}
                    size="sm"
                    title="RSVP as Accepted"
                >
                    {isLoadingRsvp && currentStatus !== 'Accepted' ? <Spinner animation="border" size="sm" /> : 'Accept'}
                </Button>
                <Button
                    variant={currentStatus === 'Tentative' ? 'warning' : 'outline-warning'}
                    className={currentStatus === 'Tentative' ? 'text-dark' : ''} // Ensure text visibility on warning
                    onClick={() => handleRSVPUpdate(event.id, 'Tentative')}
                    disabled={isLoadingRsvp}
                    size="sm"
                    title="RSVP as Tentative"
                >
                     {isLoadingRsvp && currentStatus !== 'Tentative' ? <Spinner animation="border" size="sm" /> : 'Maybe'}
                </Button>
                <Button
                    variant={currentStatus === 'Declined' ? 'danger' : 'outline-danger'}
                    onClick={() => handleRSVPUpdate(event.id, 'Declined')}
                    disabled={isLoadingRsvp}
                    size="sm"
                    title="RSVP as Declined"
                >
                     {isLoadingRsvp && currentStatus !== 'Declined' ? <Spinner animation="border" size="sm" /> : 'Decline'}
                </Button>
            </div>
        );
    };
    // --- End Render Helper ---


    // --- Main Render ---
    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-3">My Event RSVPs</h2>

            {/* Global Alerts */}
            {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>{errorMessage}</Alert>}
            {successMessage && <Alert variant="success" onClose={() => setSuccessMessage("")} dismissible>{successMessage}</Alert>}

            {/* Loading Indicator for initial fetch */}
            {isLoading && (
                <div className="text-center p-5">
                    <Spinner animation="border" variant="primary" role="status">
                        <span className="visually-hidden">Loading your RSVPs...</span>
                    </Spinner>
                </div>
            )}

            {/* Event List or No RSVPs Message */}
            {!isLoading && !errorMessage && (
                userRsvps.length > 0 ? (
                    // Use list-group for cleaner list display
                    <div className="list-group shadow-sm">
                        {userRsvps.map((rsvp) => (
                            // Each RSVP is a list group item
                            <div key={rsvp.id} className="list-group-item list-group-item-action flex-column align-items-start px-3 py-3">
                                <div className="d-flex w-100 justify-content-between mb-2">
                                    {/* Event Name - Link to community */}
                                    <h5 className="mb-1 h6 text-primary">
                                         <Link to={`/communities/${rsvp.event?.community}`} className="text-decoration-none">
                                             {rsvp.event?.event_name || 'Event Name Missing'}
                                         </Link>
                                     </h5>
                                    {/* Event Date/Time */}
                                    <small className="text-muted">
                                         {rsvp.event?.date ? new Date(rsvp.event.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute:'2-digit', hour12: true }) : 'No Date'}
                                     </small>
                                </div>

                                 {/* Community Name & Location */}
                                 <p className="mb-1 small text-muted">
                                     In <Link to={`/communities/${rsvp.event?.community}`} className="text-muted">{rsvp.event?.community_name || 'Community'}</Link>
                                     {rsvp.event?.location && ` | Location: ${rsvp.event.location}`}
                                 </p>

                                {/* RSVP Controls / Status */}
                                <div className="mt-2 d-flex justify-content-end align-items-center">
                                    {renderRsvpControls(rsvp)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // No RSVPs Message - shown only if not loading and no errors
                    <div className="text-center p-5 border rounded bg-light">
                        <p>You haven't RSVP'd to any events yet.</p>
                        <Link to="/discover/communities" className="btn btn-info text-white">
                            Discover Events
                        </Link>
                    </div>
                )
            )}
        </div>
    );
};

export default EventDashboardPage;