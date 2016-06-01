USE working;
TRUNCATE TABLE first_names;
INSERT INTO first_names (sort_order, NAME, gender, COUNT, cumulative) SELECT id, NAME, gender, COUNT, cumulative FROM firstnames_female;
INSERT INTO first_names (sort_order, NAME, gender, COUNT, cumulative) SELECT id, NAME, gender, COUNT, cumulative FROM firstnames_male;
