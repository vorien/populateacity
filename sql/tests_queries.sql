SELECT * FROM history WHERE action_id != 1 AND processed = 1 ORDER BY `year`, `action_id`, `person_id` ;

SELECT * FROM history WHERE processed = 0 ORDER BY `year`, action_id, person_id;

SELECT IFNULL(`other_id`,0) FROM history;

INSERT INTO people (`familyname`,`gender`,`birthyear`,`marriage`,`spouse_id`,`lifespan`) VALUES ('Fjerstad',0,986,1000,2,1028)

UPDATE people SET `spouse_id` = 1025, `familyname = 'Merriam' WHERE id = 2;
