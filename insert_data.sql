-- Active: 1738950369406@@127.0.0.1@3006@uni_hub_db

-- Inserts university data to auto-assign university at login
INSERT INTO app_university(university_name, university_domain, university_logo)
VALUES 
('University of Cambridge', 'cam.ac.uk', ''),
('University of Oxford', 'ox.ac.uk', ''),
('Imperial College London', 'imperial.ac.uk', ''),
('University College London', 'ucl.ac.uk', ''),
('University of the West of England', 'uwe.ac.uk', ''),
('admin', '@admin.com', '');

-- Global community for the sake of public posts
INSERT INTO app_community(community_name, description, rules, privacy, is_community_owner_id)
VALUES
("Global Community (News Feed)", "This is the global community.", "", "public", NULL);

-- Inserting dummy users for testing
INSERT INTO app_user (
    password, last_login, is_superuser, first_name, last_name, is_staff,
    date_joined, is_active, email, dob, address, postcode, bio, interests,
    academic_program, academic_year, role, profile_picture, university_id
) VALUES
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'John', 'Smith', 0, CURRENT_TIMESTAMP, 1, 'johnsmith@cam.ac.uk', '2000-01-15', '123 Example Street', 'CB1 1AA', '', 'Robotics, Sports', '', '', 'S', NULL, 1),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Jane', 'Doe', 0, CURRENT_TIMESTAMP, 1, 'janedoe@ox.ac.uk', '1999-06-23', '456 Example Road', 'OX1 2JD', '', 'Robotics, Sports', '', '', 'S', NULL, 2),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'James', 'Wilson', 0, CURRENT_TIMESTAMP, 1, 'jameswilson@uwe.ac.uk', '1998-11-30', '789 Example Lane', 'BS8 3ED', '', '', '', '', 'S', NULL, 5),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Felicity', 'Herd', 0, CURRENT_TIMESTAMP, 1, 'felicityherd@ucl.ac.uk', '2001-02-10', '101 Example Close', 'WC1E 6BT', '', 'Robotics, Sports', '', '', 'S', NULL, 4),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Bowen', 'Higgins', 0, CURRENT_TIMESTAMP, 1, 'bowenhiggins@imperial.ac.uk', '1995-09-18', '202 Example Crescent', 'SW7 2AZ', '', '', '', '', 'S', NULL, 3),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Leighton', 'Kramer', 0, CURRENT_TIMESTAMP, 1, 'leightonkramer@uwe.ac.uk', '1996-03-05', '303 Example Place', 'BS1 4TR', '', '', '', '', 'S', NULL, 5),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Amelie', 'Griffith', 0, CURRENT_TIMESTAMP, 1, 'ameliegriffith@ucl.ac.uk', '2002-07-22', '404 Example Street', 'WC1H 0XG', 'Robotics, Sports', '', '', '', 'S', NULL, 4),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Adan', 'Khan', 0, CURRENT_TIMESTAMP, 1, 'adankhan@uwe.ac.uk', '1997-12-14', '505 Example Way', 'BS3 2EL', '', '', '', '', 'S', NULL, 5),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Harold', 'Jones', 0, CURRENT_TIMESTAMP, 1, 'haroldjones@uwe.ac.uk', '2000-04-01', '606 Example Row', 'BS7 9BE', '', '', '', '', 'S', NULL, 5),
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', NULL, 0, 'Emma', 'Davis', 0, CURRENT_TIMESTAMP, 1, 'emmadavis@uwe.ac.uk', '1994-08-09', '707 Example Avenue', 'BS9 1JB', '', '', '', '', 'S', NULL, 5);

-- Inserting random follower/following relationships
INSERT INTO app_follow (followed_at, followed_user_id, following_user_id) VALUES
    (NOW(),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk'),
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk'));

-- Creating random posts from random users in global community


-- Inserting the communities with appropriate owners
INSERT INTO app_community (
    community_name, description, rules, privacy, is_community_owner_id
) VALUES
('UWE Games Society', 'Chess, Games', 'Be respectful and have fun.', 'public',
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),
('Study Skills', 'Academic help and peer learning.', 'Keep it focused and respectful.', 'public',
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk')),
('Engineering Society', 'All things engineering!', 'Constructive discussion only.', 'public',
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),
('Football Society', 'Join us for weekly football matches.', 'Play fair.', 'public',
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),
('Bowling Society', 'Casual and league bowling events.', 'Respect all players.', 'public',
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),
('Art Society', 'Explore your creativity.', 'No hate speech.', 'public',
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),
('Film Club', 'Weekly screenings and discussion.', 'Avoid spoilers.', 'public',
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),
('Python Lovers', 'A place to talk Python.', 'Code of conduct applies.', 'public',
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),
('Django Buddies', 'For web developers using Django.', 'Be kind and helpful.', 'public',
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk'));

-- Inserting into keyword table to attach keywords to some communities
INSERT INTO app_keyword (keyword)
VALUES 
('Chess'), 
('Games');

-- Attach the keywords to communities
INSERT INTO app_communitykeyword (community_id, keyword_id)
VALUES
(
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_keyword WHERE keyword = 'Chess')
),
(
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_keyword WHERE keyword = 'Games')
);


-- Inserting memberships into those communities, including the membership for the leader
INSERT INTO app_usercommunity (joined_at, role, community_id, user_id) VALUES
    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Study Skills'),
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Football Society'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Bowling Society'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Art Society'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Film Club'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Python Lovers'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW(), 'Leader',
    (SELECT id FROM app_community WHERE community_name = 'Django Buddies'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),
    
    (NOW(), 'Member',
    (SELECT id FROM app_community WHERE community_name = 'Study Skills'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),
    
    (NOW(), 'Member',
    (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
        (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
        (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
        (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Study Skills'),
        (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Study Skills'),
        (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
        (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
        (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Football Society'),
        (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Football Society'),
        (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Bowling Society'),
        (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Bowling Society'),
        (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Art Society'),
        (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Art Society'),
        (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Film Club'),
        (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Film Club'),
        (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Python Lovers'),
        (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Python Lovers'),
        (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),

    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Django Buddies'),
        (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),
    (NOW(), 'Member',
        (SELECT id FROM app_community WHERE community_name = 'Django Buddies'),
        (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'));

-- Creating posts in the communities


-- Creating announcements in the communities


-- Create events
INSERT INTO app_event (
    event_name, date, location, description, event_type, community_id, capacity
) VALUES
    ('CV Workshop', 
    '2025-06-01 14:00:00', 
    'Careers Centre 2A', 
    'Get help refining your CV with professionals.', 
    'workshop',
    (SELECT id FROM app_community WHERE community_name = 'Study Skills'), 80),

    ('Freshers Open Mic', 
    '2025-06-05 19:00:00', 
    'Student Union Hall',
    'A casual open mic night for new students.', 
    'social gathering',
    (SELECT id FROM app_community WHERE community_name = 'Film Club'), 120),

    ('Charity Fundraiser', 
    '2025-06-10 17:30:00', 
    'Main Quad', 
    'Fundraiser for local charities. Join and contribute!', 
    'other',
    (SELECT id FROM app_community WHERE community_name = 'Engineering Society'), 150),

    ('Football Social Night', 
    '2025-06-12 18:00:00', 
    'Campus Football Courts', 
    'Play and mingle with football lovers.', 
    'social gathering',
    (SELECT id FROM app_community WHERE community_name = 'Football Society'), 40),

    ('Old Movie Screening', 
    '2025-06-15 20:00:00', 
    'Film Club Room A', 
    'Screening of a classic film followed by discussion.', 
    'social gathering',
    (SELECT id FROM app_community WHERE community_name = 'Film Club'), 60);