UPDATE people SET givenname = NULL;
UPDATE people 
SET givenname = IF(gender = 1, GetRandomFemaleName(), GetRandomFemaleName()),
familyname = GetRandomFamilyName();

SELECT familyname, COUNT(id) AS cid FROM people GROUP BY familyname ORDER BY cid DESC;
