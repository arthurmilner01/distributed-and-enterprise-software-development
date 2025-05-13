    import { Link } from "react-router-dom";
    import { useAuth } from "../../context/AuthContext";
    import { User, Users, CalendarDays } from 'lucide-react';

    const DiscoverPage = () => {

    return (
        <div className="d-flex flex-column align-items-center justify-content-start" style={{ minHeight: "80vh", paddingTop: "25vh" }}>
            <h1 className="mb-4">Discover</h1>
            <div className="container">
                <hr className="border border-primary border-2 text-info" />
                <div className="row text-center mb-3">
                    <div className="col">
                    <User size={100} />
                    </div>
                    <div className="col">
                    <Users size={100} />
                    </div>
                    <div className="col">
                    <CalendarDays size={100} />
                    </div>
                </div>

                <div className="row text-center">
                    <div className="col">
                    <Link to="/discover/users" className="btn btn-info text-white w-100">
                        Discover Users
                    </Link>
                    </div>
                    <div className="col">
                    <Link to="/discover/communities" className="btn btn-info text-white w-100">
                        Discover Communities
                    </Link>
                    </div>
                    <div className="col">
                    <Link to="/discover/events" className="btn btn-info text-white w-100">
                        Discover Events
                    </Link>
                    </div>
                </div>
            </div>
        </div>
    );
    };

    export default DiscoverPage;