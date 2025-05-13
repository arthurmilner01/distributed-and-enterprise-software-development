import { useAuth } from "../../context/AuthContext";
import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Filter } from "lucide-react";
import useApi from "../../api";
import { useNavigate } from "react-router-dom";
import { PaginationComponent } from "../widgets/PaginationComponent";
import { Alert } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EventCard = ({ event, onViewCommunity }) => {
    const eventDate = new Date(event.date);
    const isPastEvent = eventDate < new Date();
    
    const renderLocationWithLinks = (locationText) => {
        if (locationText && locationText.includes('Zoom Link:')) {
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
        
        return locationText || "N/A";
    };
    
    return (
        <div className="card h-100 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-truncate" title={event.event_name}>
                    {event.event_name}
                </h5>
                <span className={`badge ${isPastEvent ? 'bg-secondary' : 'bg-success'}`}>
                    {isPastEvent ? 'Past' : 'Upcoming'}
                </span>
            </div>
            <div className="card-body">
                <p className="card-text mb-1">
                    <strong>Date:</strong> {eventDate.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}
                </p>
                <p className="card-text mb-1">
                    <strong>Type:</strong> <span className="text-capitalize">{event.event_type || "N/A"}</span>
                </p>
                <p className="card-text mb-1">
                    <strong>Community:</strong> {event.community_name || "N/A"}
                </p>
                <p className="card-text mb-1">
                    <strong>Location:</strong> {renderLocationWithLinks(event.location)}
                </p>
                {event.description && (
                    <p className="card-text mt-2">
                        {event.description.length > 100
                            ? `${event.description.substring(0, 100)}...`
                            : event.description}
                    </p>
                )}
            </div>
            <div className="card-footer bg-white">
                <button
                    className="btn btn-info text-white w-100"
                    onClick={() => onViewCommunity(event.community)}
                >
                    View Community
                </button>
            </div>
        </div>
    );
};

const DiscoverEventsPage = () => {
    const navigate = useNavigate();
    const api = useApi();

    //Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [eventTypeFilter, setEventTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all"); // 'all', 'upcoming', 'past'
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sortOrder, setSortOrder] = useState("date");

    //Results state
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    //Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    //Perform the event search API call
    const performSearch = useCallback(async (page = currentPage) => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            let params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (eventTypeFilter !== "all") params.append("event_type", eventTypeFilter);
            if (dateFilter !== "all") params.append("date_filter", dateFilter);
            if (startDate) params.append("start_date", startDate.toISOString());
            if (endDate) params.append("end_date", endDate.toISOString());
            params.append("ordering", sortOrder);
            params.append("page", page.toString());

            const response = await api.get(`/api/event-search/?${params.toString()}`);

            setEvents(response.data.results || []);
            setTotalItems(response.data.count || 0);
            setTotalPages(response.data.total_pages || 1);
            
            //Setting current page in case it's out of bounds
            if (response.data.total_pages > 0 && page > response.data.total_pages) {
                setCurrentPage(response.data.total_pages);
            }
        } catch (error) {
            console.error("Error searching events:", error);
            setErrorMessage("Failed to search events. Please try again.");
            setEvents([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [api, searchQuery, eventTypeFilter, dateFilter, startDate, endDate, sortOrder, currentPage]);

    //Initial data load
    useEffect(() => {
        performSearch(1);
    }, []);

    //Search when filters change - reset to page 1
    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
        performSearch(1);
    }, [eventTypeFilter, dateFilter, sortOrder]);

    //Handle page change only
    useEffect(() => {
        //Only fetch if this effect isn't triggered by filter changes
        //(which is handled by the effect above)
        if (eventTypeFilter || dateFilter || sortOrder) {
            performSearch(currentPage);
        }
    }, [currentPage]);

    //When user searches manually
    const handleSearch = useCallback((e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        performSearch(1);
    }, [searchQuery, eventTypeFilter, dateFilter, startDate, endDate, sortOrder, performSearch]);

    //Handle page change
    const handlePageChange = useCallback((newPage) => {
        setCurrentPage(newPage);
    }, []);

    //Navigate to community page
    const handleViewCommunity = useCallback((communityId) => {
        navigate(`/communities/${communityId}`);
    }, [navigate]);

    //Handle date filter change
    const handleDateFilterChange = (filter) => {
        setDateFilter(filter);
        //Reset to page 1 when changing date filter
        setCurrentPage(1);
        if (filter !== 'custom') {
            setStartDate(null);
            setEndDate(null);
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-3">Discover Events</h2>

            {/* Alerts */}
            {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>{errorMessage}</Alert>}
            {successMessage && <Alert variant="success" onClose={() => setSuccessMessage("")} dismissible>{successMessage}</Alert>}

            {/* Search Panel */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-info text-white">
                    <h4 className="mb-0">Search Events</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search by event name or description..." 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                        aria-label="Search events"
                                    />
                                    <button type="submit" className="btn btn-info">
                                        <Search size={18} className="me-1" /> Search
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <select 
                                    className="form-select" 
                                    value={eventTypeFilter} 
                                    onChange={(e) => {
                                        setEventTypeFilter(e.target.value);
                                        // Reset to page 1 automatically handled by useEffect
                                    }} 
                                    aria-label="Filter by event type"
                                >
                                    <option value="all">All Event Types</option>
                                    <option value="conference">Conference</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="webinar">Webinar</option>
                                    <option value="social">Social Gathering</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="competition">Competition</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <select 
                                    className="form-select" 
                                    value={dateFilter} 
                                    onChange={(e) => handleDateFilterChange(e.target.value)} 
                                    aria-label="Filter by date"
                                >
                                    <option value="all">All Dates</option>
                                    <option value="upcoming">Upcoming Events</option>
                                    <option value="past">Past Events</option>
                                    <option value="today">Today</option>
                                    <option value="this_week">This Week</option>
                                    <option value="next_week">Next Week</option>
                                    <option value="this_month">This Month</option>
                                    <option value="custom">Custom Date Range</option>
                                </select>
                            </div>

                            {dateFilter === 'custom' && (
                                <div className="col-md-8">
                                    <div className="row align-items-center">
                                        <div className="col-md-3">
                                            <DatePicker
                                                selected={startDate}
                                                onChange={(date) => setStartDate(date)}
                                                selectsStart
                                                startDate={startDate}
                                                endDate={endDate}
                                                className="form-control"
                                                placeholderText="Start Date"
                                                isClearable
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <DatePicker
                                                selected={endDate}
                                                onChange={(date) => setEndDate(date)}
                                                selectsEnd
                                                startDate={startDate}
                                                endDate={endDate}
                                                minDate={startDate}
                                                className="form-control"
                                                placeholderText="End Date"
                                                isClearable
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <button 
                                                type="button" 
                                                className="btn btn-success" 
                                                onClick={() => {
                                                    setCurrentPage(1);
                                                    performSearch(1);
                                                }}
                                            >
                                                Apply Dates
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {dateFilter !== 'custom' && (
                                <div className="col-md-4 ms-auto">
                                    <select 
                                        className="form-select" 
                                        value={sortOrder} 
                                        onChange={(e) => {
                                            setSortOrder(e.target.value);
                                            // Reset to page 1 automatically handled by useEffect
                                        }} 
                                        aria-label="Sort results"
                                    >
                                        <option value="date">Date (Nearest First)</option>
                                        <option value="-date">Date (Furthest First)</option>
                                        <option value="event_name">Name (A-Z)</option>
                                        <option value="-event_name">Name (Z-A)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Events Results Card */}
            <div className="card shadow-sm">
                <div className="card-header bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Events</h4>
                        {!isLoading && (
                            <span className="text-muted">{totalItems} event{totalItems !== 1 ? 's' : ''} found</span>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    {isLoading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-info" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : events.length > 0 ? (
                        <>
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                {events.map((event) => (
                                    <div key={event.id} className="col">
                                        <EventCard
                                            event={event}
                                            onViewCommunity={handleViewCommunity}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Component */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <PaginationComponent
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        handlePageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-5">
                            <p>No events found matching your search criteria.</p>
                            <p>Try adjusting your search terms or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoverEventsPage;