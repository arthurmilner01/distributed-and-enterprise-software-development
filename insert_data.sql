-- Active: 1740148092384@@127.0.0.1@3006

INSERT INTO app_university(university_name, university_domain, university_logo)
VALUES 
('University of Cambridge', 'cam.ac.uk', ''),
('University of Oxford', 'ox.ac.uk', ''),
('Imperial College London', 'imperial.ac.uk', ''),
('University College London', 'ucl.ac.uk', ''),
('University of the West of England', 'uwe.ac.uk', ''),
('admin', '@admin.com', '');

INSERT INTO app_community(community_name, description, rules, privacy, is_community_owner_id)
VALUES
("Global Community (News Feed)", "This is the global community.", "", "public", NULL);
