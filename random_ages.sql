UPDATE people SET age = FLOOR((RAND() * (1000))+1), lifespan = FLOOR((RAND() * (1000))+1);

/*
select * from people p
#inner JOIN `HarnAgeExploded` a ON p.age = a.`Roll`
INNER JOIN `HarnLifespanExploded` l ON p.lifespan = l.`Roll`
;


start transaction;
UPDATE people
INNER JOIN `HarnAgeExploded` ON people.age = HarnAgeExploded.`Roll`
set people.age = HarnAgeExploded.`Age`;


UPDATE people
INNER JOIN `HarnLifespanExploded` ON people.lifespan = `HarnLifespanExploded`.`Roll`
set people.`lifespan` = `HarnLifespanExploded`.`Age`;
Commit;

START TRANSACTION;
UPDATE people 
set lifespan = (
	select age as lifespan 
	from `HarnLifespanExploded` 
	where `Roll` = FLOOR((RAND() * (1000))+1) LIMIT 1
);
COMMIT;
*/

START TRANSACTION;
UPDATE people
INNER JOIN `HarnAgeExploded` ON people.age = HarnAgeExploded.`Roll`
INNER JOIN `HarnLifespanExploded` ON people.lifespan = `HarnLifespanExploded`.`Roll`
SET people.age = HarnAgeExploded.`Age`, people.`lifespan` = `HarnLifespanExploded`.`Age`;
COMMIT;

UPDATE people SET deceased = 1 WHERE age > lifespan;

