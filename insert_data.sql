-- Active: 1740148092384@@127.0.0.1@3006

USE uni_hub_db;

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
('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'John', 'Smith', 0, CURRENT_TIMESTAMP, 1, 'johnsmith@cam.ac.uk', '2000-01-15', 
'123 Example Street', 'CB1 1AA', 'A passionate robotics enthusiast and aspiring engineer, excited to contribute to the global community!', 
'Robotics, Sports', 'Robotics Engineering', 1, 'S', NULL, 1),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Jane', 'Doe', 0, CURRENT_TIMESTAMP, 1, 'janedoe@ox.ac.uk', '1999-06-23', '456 Example Road', 
'OX1 2JD', 'Eager to learn and collaborate on cutting-edge projects!', 'Robotics, Sports', 
'Mechanical Engineering', 2, 'S', NULL, 2),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'James', 'Wilson', 0, CURRENT_TIMESTAMP, 1, 'jameswilson@uwe.ac.uk', '1998-11-30', 
'789 Example Lane', 'BS8 3ED', 'A passionate swimmer and environmentalist, currently focused on sustainable engineering practices.', 
'Swimming', 'Environmental Engineering', 3, 'S', NULL, 5),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Felicity', 'Herd', 0, CURRENT_TIMESTAMP, 1, 'felicityherd@ucl.ac.uk', '2001-02-10', '101 Example Close', 
'WC1E 6BT', 'Aspiring to revolutionize robotics, passionate about sports and fitness.', 'Robotics, Sports', 
'Robotics Engineering', 1, 'S', NULL, 4),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Bowen', 'Higgins', 0, CURRENT_TIMESTAMP, 1, 'bowenhiggins@imperial.ac.uk', '1995-09-18', 
'202 Example Crescent', 'SW7 2AZ', 'Excited to explore new diving spots and continuously push my limits in athletics!', 
'Diving, Running', 'Sports Science', 2, 'S', NULL, 3),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Leighton', 'Kramer', 0, CURRENT_TIMESTAMP, 1, 'leightonkramer@uwe.ac.uk', '1996-03-05', 
'303 Example Place', 'BS1 4TR', 'Currently focusing on mastering programming languages and building innovative solutions.', 
'Programming, Engineering', 'Computer Science', 3, 'S', NULL, 5),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Amelie', 'Griffith', 0, CURRENT_TIMESTAMP, 1, 'ameliegriffith@ucl.ac.uk', '2002-07-22', 
'404 Example Street', 'WC1H 0XG', 'Striving to create sustainable solutions through robotics and technology!', 
'Robotics, Sports', 'Electrical Engineering', 2, 'S', NULL, 4),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Adan', 'Khan', 0, CURRENT_TIMESTAMP, 1, 'adankhan@uwe.ac.uk', '1997-12-14', '505 Example Way', 
'BS3 2EL', 'I am passionate about gaming and exploring the intersection of technology and entertainment.', 
'Gaming', 'Game Design', 1, 'S', NULL, 5),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Harold', 'Jones', 0, CURRENT_TIMESTAMP, 1, 'haroldjones@uwe.ac.uk', '2000-04-01', 
'606 Example Row', 'BS7 9BE', 'Love playing hockey and exploring new tech innovations.', 'Hockey', 
'Business Management', 3, 'S', NULL, 5),

('pbkdf2_sha256$1000000$1lcuE4cLl4mVSRqaeq1IPi$cY5FNs7w8XFPWODruMarNDdKHMznbkn+uOarysXs3fU=', 
NULL, 0, 'Emma', 'Davis', 0, CURRENT_TIMESTAMP, 1, 'emmadavis@uwe.ac.uk', '1994-08-09', 
'707 Example Avenue', 'BS9 1JB', 'Passionate about snowboarding, and interested in technology and creative expression.', 
'Snowboarding, Guitar', 'Creative Arts', 2, 'S', NULL, 5);

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
INSERT INTO app_post (created_at, post_text, image, community_id, user_id) VALUES
    (NOW() - INTERVAL 7 DAY, 'Excited to join the Global Community! #newmember', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW() - INTERVAL 5 DAY, 'Anyone up for a virtual study group this week? #study #engineering', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW() - INTERVAL 4 DAY, 'Loving the vibes here already! #newmember', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW() - INTERVAL 3 DAY, 'Does anyone know where I can find last year’s exam papers? #engineering', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk')),

    (NOW() - INTERVAL 2 DAY, 'Had a great experience at the CV Workshop today. Highly recommend it! #study', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk')),

    (NOW() - INTERVAL 1 DAY, 'Looking forward to the upcoming social events! #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk')),

    (NOW() - INTERVAL 12 HOUR, 'Check out this article I found on sustainable engineering practices. #engineering', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(), 'Morning everyone! Hope you all have a productive day. #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW() - INTERVAL 10 DAY, 'Finally settled in! Looking forward to meeting new people here. #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),

    (NOW() - INTERVAL 9 DAY, 'What clubs are everyone joining this semester? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk')),

    (NOW() - INTERVAL 6 DAY, 'Is there a Discord or WhatsApp group for international students? #international #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW() - INTERVAL 3 DAY, 'Anyone else going to the charity fundraiser on Friday? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW() - INTERVAL 30 HOUR, 'Missing my girls from back home! #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW() - INTERVAL 16 HOUR, 'Let’s organize a virtual movie night this weekend? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW() - INTERVAL 6 HOUR, 'Working on a Python script. Can anyone help? #engineering #study', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(), 'Good luck to everyone with upcoming deadlines! #study #group', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Global Community (News Feed)'),
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'));

-- Inserting the hashtags used in the posts
INSERT INTO app_hashtag (name) VALUES
    ('social'),
    ('study'),
    ('engineering'),
    ('newmember'),
    ('international'),
    ('group');

-- Create post and hashtag relationship
INSERT INTO app_post_hashtags (post_id, hashtag_id)
SELECT 
    p.id AS post_id,
    h.id AS hashtag_id
FROM 
    app_post p
JOIN 
    app_hashtag h ON 
(
    (h.name = 'newmember' AND p.post_text = 'Excited to join the Global Community! #newmember') OR
    (h.name = 'study' AND p.post_text = 'Anyone up for a virtual study group this week? #study #engineering') OR
    (h.name = 'engineering' AND p.post_text = 'Anyone up for a virtual study group this week? #study #engineering') OR
    (h.name = 'newmember' AND p.post_text = 'Loving the vibes here already! #newmember') OR
    (h.name = 'engineering' AND p.post_text = 'Does anyone know where I can find last year’s exam papers? #engineering') OR
    (h.name = 'study' AND p.post_text = 'Had a great experience at the CV Workshop today. Highly recommend it! #study') OR
    (h.name = 'social' AND p.post_text = 'Looking forward to the upcoming social events! #social') OR
    (h.name = 'engineering' AND p.post_text = 'Check out this article I found on sustainable engineering practices. #engineering') OR
    (h.name = 'social' AND p.post_text = 'Morning everyone! Hope you all have a productive day. #social') OR
    (h.name = 'social' AND p.post_text = 'Finally settled in! Looking forward to meeting new people here. #social') OR
    (h.name = 'social' AND p.post_text = 'What clubs are everyone joining this semester? #social') OR
    (h.name = 'international' AND p.post_text = 'Is there a Discord or WhatsApp group for international students? #international #social') OR
    (h.name = 'social' AND p.post_text = 'Anyone else going to the charity fundraiser on Friday? #social') OR
    (h.name = 'social' AND p.post_text = 'Missing my girls from back home! #social') OR
    (h.name = 'social' AND p.post_text = 'Let’s organize a virtual movie night this weekend? #social') OR
    (h.name = 'engineering' AND p.post_text = 'Working on a Python script. Can anyone help? #engineering #study') OR
    (h.name = 'study' AND p.post_text = 'Working on a Python script. Can anyone help? #engineering #study') OR
    (h.name = 'study' AND p.post_text = 'Good luck to everyone with upcoming deadlines! #study #group') OR
    (h.name = 'group' AND p.post_text = 'Good luck to everyone with upcoming deadlines! #study #group')
);

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
INSERT INTO app_post (created_at, post_text, image, community_id, user_id) VALUES
    (NOW() - INTERVAL 7 DAY, 'Excited to become a member of the UWE Games Society! #newmember', NULL,
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),

    (NOW() - INTERVAL 5 DAY, 'Anyone up for a in-person study group this week on campus? #study #engineering', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW() - INTERVAL 4 DAY, 'Loving the Uni Hub already! #newmember', NULL,
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW() - INTERVAL 3 DAY, 'Does anyone know where I can find past papers? #engineering', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
    (SELECT id FROM app_user WHERE email = 'leightonkramer@uwe.ac.uk')),

    (NOW() - INTERVAL 2 DAY, 'Had a great experience at the library today. Highly recommend it! #study', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Study Skills'),
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk')),

    (NOW() - INTERVAL 1 DAY, 'Looking forward to the upcoming football events! #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Football Society'),
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk')),

    (NOW() - INTERVAL 12 HOUR, 'Anyone else love sustainable engineering practices?! #engineering', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Engineering Society'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(), 'Morning everyone! Who caught the footy last night? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Football Society'),
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW() - INTERVAL 10 DAY, 'Hey guys what games are we playing this week? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk')),

    (NOW() - INTERVAL 9 DAY, 'What clubs are everyone joining this semester? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'UWE Games Society'),
    (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk')),

    (NOW() - INTERVAL 6 DAY, 'Anyone about for a kickabout later on campus? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Football Society'),
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW() - INTERVAL 3 DAY, 'Who will be at the charity fundraiser on Friday? #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Football Society'),
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk')),

    (NOW() - INTERVAL 30 HOUR, 'Throwback to the Open Mic Night — incredible performances! #social', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Film Club'),
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW() - INTERVAL 16 HOUR, 'Anyone around to watch a classic film next week?', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Film Club'),
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW() - INTERVAL 6 HOUR, 'Working on a Python side project. Anyone interested in collaborating? #engineering #study', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Python Lovers'),
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(), 'Good luck to everyone with deadlines coming up! #study #group', NULL,
    (SELECT id FROM app_community WHERE community_name = 'Study Skills'),
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'));

-- Post hashtag relationship
INSERT INTO app_post_hashtags (post_id, hashtag_id)
SELECT 
    p.id AS post_id,
    h.id AS hashtag_id
FROM 
    app_post p
JOIN 
    app_hashtag h ON 
(
    (h.name = 'newmember' AND p.post_text = 'Excited to become a member of the UWE Games Society! #newmember') OR
    (h.name = 'study' AND p.post_text = 'Anyone up for a in-person study group this week on campus? #study #engineering') OR
    (h.name = 'engineering' AND p.post_text = 'Anyone up for a in-person study group this week on campus? #study #engineering') OR
    (h.name = 'newmember' AND p.post_text = 'Loving the Uni Hub already! #newmember') OR
    (h.name = 'engineering' AND p.post_text = 'Does anyone know where I can find past papers? #engineering') OR
    (h.name = 'study' AND p.post_text = 'Had a great experience at the library today. Highly recommend it! #study') OR
    (h.name = 'social' AND p.post_text = 'Looking forward to the upcoming football events! #social') OR
    (h.name = 'engineering' AND p.post_text = 'Anyone else love sustainable engineering practices?! #engineering') OR
    (h.name = 'social' AND p.post_text = 'Morning everyone! Who caught the footy last night? #social') OR
    (h.name = 'social' AND p.post_text = 'Hey guys what games are we playing this week? #social') OR
    (h.name = 'social' AND p.post_text = 'Anyone about for a kickabout later on campus? #social') OR
    (h.name = 'social' AND p.post_text = 'Who will be at the charity fundraiser on Friday? #social') OR
    (h.name = 'social' AND p.post_text = 'Throwback to the Open Mic Night — incredible performances! #social') OR
    (h.name = 'engineering' AND p.post_text = 'Working on a Python side project. Anyone interested in collaborating? #engineering #study') OR
    (h.name = 'study' AND p.post_text = 'Working on a Python side project. Anyone interested in collaborating? #engineering #study') OR
    (h.name = 'study' AND p.post_text = 'Good luck to everyone with deadlines coming up! #study #group') OR
    (h.name = 'group' AND p.post_text = 'Good luck to everyone with deadlines coming up! #study #group')
);

-- Adding some comments to a few of the posts
INSERT INTO app_comment (
    comment_text, created_at, user_id, post_id
) VALUES
    ('This is a great post! Looking forward to meeting you all.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Excited to join the Global Community%')),

    ('I totally agree!.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Excited to join the Global Community%')),

    ('I would definitely be down for that.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Anyone up for a virtual study group%')),

    ('I love virtual study groups!.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Anyone up for a virtual study group%')),

    ('Does anyone have suggestions for other useful study resources?', NOW(), 
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%')),

    ('Have you tried google!', NOW(), 
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%')),

    ('I have no idea, sorry.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%')),
    
    ('This is a great post! Looking forward to meeting you all.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Excited to join the Global Community%')),

    ('I totally agree!.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'johnsmith@cam.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Excited to join the Global Community%')),

    ('Very keen for this.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Anyone up for a virtual study group%')),

    ('Would love to!.', NOW(), 
    (SELECT id FROM app_user WHERE email = 'emmadavis@uwe.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Anyone up for a virtual study group%')),

    ('AQA might have some?', NOW(), 
    (SELECT id FROM app_user WHERE email = 'haroldjones@uwe.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%')),

    ('Have you tried bing!', NOW(), 
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk'), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%'));

-- Adding likes to some of the posts
INSERT INTO app_postlike (
    liked_at, post_id, user_id
) VALUES
    (NOW(), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Excited to join the Global Community%'), 
    (SELECT id FROM app_user WHERE email = 'janedoe@ox.ac.uk')),

    (NOW(), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Anyone up for a virtual study group%'), 
    (SELECT id FROM app_user WHERE email = 'jameswilson@uwe.ac.uk')),

    (NOW(), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Anyone up for a virtual study group%'), 
    (SELECT id FROM app_user WHERE email = 'felicityherd@ucl.ac.uk')),

    (NOW(), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%'), 
    (SELECT id FROM app_user WHERE email = 'bowenhiggins@imperial.ac.uk')),

    (NOW(), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%'), 
    (SELECT id FROM app_user WHERE email = 'ameliegriffith@ucl.ac.uk')),

    (NOW(), 
    (SELECT id FROM app_post WHERE post_text LIKE '%Does anyone know where I can find last year’s exam papers%'), 
    (SELECT id FROM app_user WHERE email = 'adankhan@uwe.ac.uk'));

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