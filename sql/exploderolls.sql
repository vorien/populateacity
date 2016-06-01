DELIMITER $$
USE `working`$$
DROP PROCEDURE IF EXISTS `test1`$$

CREATE DEFINER=`vhost`@`%` PROCEDURE `test1`()
BEGIN
	DECLARE c_done INT;
	DECLARE age INT;
	DECLARE st INT;
	DECLARE en INT;
	DECLARE X  INT;
	DECLARE Y  INT;
	DECLARE curs CURSOR FOR  SELECT * FROM HarnAge;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET c_done = 1;

	DROP TEMPORARY TABLE IF EXISTS tblResults;
	CREATE TEMPORARY TABLE IF NOT EXISTS tblResults  (
		`Age` INT,
		`Roll` INT
	);

	OPEN curs;
	explode_rolls LOOP:
		FETCH curs INTO age,st,en;
		IF c_done = 1 THEN
			LEAVE explode_rolls;
		END IF;
		SET X = st;
		SET Y = en;
		IF X = Y THEN
			INSERT INTO tblResults VALUES (age, X);
		ELSE
			WHILE X  <= Y DO
				INSERT INTO tblResults VALUES (age, X);
				SET  X = X + 1; 
			END WHILE;
		END IF;
	END LOOP explode_rolls;
	CLOSE curs;

	SELECT * FROM tblResults;
END$$
DELIMITER ;