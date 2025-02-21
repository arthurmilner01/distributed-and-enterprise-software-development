


INSERT INTO app_university(university_name, university_domain, university_logo)
VALUES 
('University of Cambridge', 'cam.ac.uk', ''),
('University of Oxford', 'ox.ac.uk', ''),
('Imperial College London', 'imperial.ac.uk', ''),
('University College London', 'ucl.ac.uk', ''),
('University of the West of England', 'uwe.ac.uk', ''),
('Gmail', 'gmail.com', ''),
('test1', 'test.com', ''),
('test2', 'test.test', '');


-- Test123!
INSERT INTO app_user(
    password,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    bio,
    interests,
    role,
    profile_picture,
    university_id
) 
VALUES 
(
    'pbkdf2_sha256$870000$GzJyZOsAtDhChag2kjAMZa$rQRp913xfkQTqwhiDNAGRp1A65gSJkj7x0bv5F9Q15E=',
    0,
    'student',
    'Test',
    'Student',
    'student@uwe.ac.uk',
    0,
    1, 
    CURRENT_TIMESTAMP,
    'Loving the hub.',
    'Student, Studying',
    'S',
    '',
    5
);

-- Test123!
INSERT INTO app_user(
    password,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    bio,
    interests,
    role,
    profile_picture,
    university_id
) 
VALUES 
(
    'pbkdf2_sha256$870000$GzJyZOsAtDhChag2kjAMZa$rQRp913xfkQTqwhiDNAGRp1A65gSJkj7x0bv5F9Q15E=',
    0,
    'eventmanager',
    'Test',
    'Event',
    'event@uwe.ac.uk',
    0,
    1, 
    CURRENT_TIMESTAMP,
    'Loving the events.',
    'Organising, Helping',
    'E',
    '',
    5
);

-- Test123!
INSERT INTO app_user(
    password,
    is_superuser,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    bio,
    interests,
    role,
    profile_picture,
    university_id
) 
VALUES 
(
    'pbkdf2_sha256$870000$GzJyZOsAtDhChag2kjAMZa$rQRp913xfkQTqwhiDNAGRp1A65gSJkj7x0bv5F9Q15E=',
    0,
    'communitymanager',
    'Test',
    'CommunityManager',
    'community@uwe.ac.uk',
    0,
    1, 
    CURRENT_TIMESTAMP,
    'Loving the events.',
    'Organising, Helping',
    'C',
    '',
    5
);

