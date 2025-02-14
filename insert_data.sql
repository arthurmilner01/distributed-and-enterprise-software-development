


INSERT INTO app_university(university_name, university_domain, university_logo_path)
VALUES 
('University of Cambridge', 'cam.ac.uk', ''),
('University of Oxford', 'ox.ac.uk', ''),
('Imperial College London', 'imperial.ac.uk', ''),
('University College London', 'ucl.ac.uk', ''),
('University of the West of England', 'uwe.ac.uk', ''),
('Gmail', 'gmail.com', ''),
('test1', 'test.com', ''),
('test2', 'test.test', '');


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
    profile_picture_path,
    university_id
) 
VALUES 
(
    'password',
    1,
    'admin',
    'Admin',
    'User',
    'admin@uwe.ac.uk',
    1,
    1, 
    CURRENT_TIMESTAMP,
    'Loving the hub.',
    'Administration, Management',
    'A',
    '',
    5
);