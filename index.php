<?php

if (!extension_loaded('apc')) {
	session_start();
}

ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', false);
while (@ob_end_flush());
ini_set('implicit_flush', true);
ob_implicit_flush(true);
echo(str_repeat(' ', 1000) . "<br>\n");
flush();

$starttime = microtime(true);
error_reporting(-1);
ini_set('display_errors', 'On');
ini_set('memory_limit', '1G');

include_once("GlobalFunctions.php");
include_once("DbClass.php");
include_once("CacheClass.php");
include_once("PersonFunctions.php");
include_once("YearClass.php");

$db = Db::getInstance();
$link = $db->getConnection();

//$sql = "SELECT * FROM people";
//ExecuteQuery($sql);
//$sql = "UPDATE history SET person_id = 1 WHERE id = 1000000";
//ExecuteQuery($sql);


$harnage = $link->query("SELECT age, start,end FROM HarnAge")->fetchAll(PDO::FETCH_ASSOC);
$harnlifespan = $link->query("SELECT age, start, end FROM HarnLifespan")->fetchAll(PDO::FETCH_ASSOC);
$harnfertilityzero = $link->query("SELECT age, start, end FROM HarnFertility")->fetchAll(PDO::FETCH_ASSOC);
foreach ($harnfertilityzero as $key => $value) {
	$harnfertility[$key + 15] = $value;
}
//$femalenameslist = $link->query("SELECT id, name from firstnames_female order by id")->fetchAll(PDO::FETCH_ASSOC);
//foreach ($femalenameslist as $key => $value) {
//	$femalenames[$key + 1] = $value;
//}
//$malenameslist = $link->query("SELECT id, name from firstnames_male order by id")->fetchAll(PDO::FETCH_ASSOC);
//foreach ($malenameslist as $key => $value) {
//	$malenames[$key + 1] = $value;
//}
//pr($femalenames);
//pr($malenames);

setData('history', ['person_id', 'action_id', 'year', 'occurrence', 'other_id', 'processed']);
$actions = [];
$actions['birthyear'] = [1, 'Born', 'mother_id', 1];
$actions['marriage'] = [2, 'Married', 'spouse_id', 0];
$actions['nextchild'] = [3, 'Child', 'child_id', 0];
$actions['fertility'] = [4, 'Infertility', null, 0];
$actions['lifespan'] = [5, 'Died', null, 0];
setData('actions', $actions);

setData('harnage', $harnage);
setData('harnlifespan', $harnlifespan);
setData('harnfertility', $harnfertility);
//setData('femalenames', $femalenames);
//setData('malenames', $malenames);

$startingpopulation = 100;
$maxpopulation = 1000;
$startyear = 1000;
$dumpmax = 300;

setData('currentyear', $startyear);

$start = true;
if ($start) {
	$sql = "TRUNCATE TABLE people";
	$link->query($sql);
	$sql = "TRUNCATE TABLE history";
	$link->query($sql);

	for ($ctr = 0; $ctr < $startingpopulation; $ctr++) {
		$newid = CreateFemale($start);
	}
}

$sql = "SELECT count(`id`) as cid FROM people WHERE deceased = 0";
if ($populationcount = ExecuteQuery($sql)) {
	$currentpopulation = $populationcount[0]['cid'];
	echoline($currentpopulation, "Starting population");
	while ($currentpopulation < $maxpopulation) {
		$nextaction = $link->query("SELECT * FROM history WHERE processed = 0 ORDER BY `year`, action_id, person_id  LIMIT 1")->fetch(PDO::FETCH_ASSOC);
		if (empty($nextaction)) {
			echoline("Out of actions");
			break;
		}
//	pr($nextaction);
		setData('currentyear', $nextaction['year']);
		$actor = $link->query("Select * from people where id = " . $nextaction['person_id'])->fetch(PDO::FETCH_ASSOC);
//	pr($actor);
		switch ($nextaction['action_id']) {
			case 1: // Born
				//Error, should not have been selected;
				break;
			case 2: //Married
				if ($actor['gender'] == 1) {
					$spouse = GetMaleSpouse($actor);
					$sql = "UPDATE people set `spouse_id` = " . $spouse[0] . ", `familyname` = '" . $spouse[1] . "' WHERE id = " . $actor['id'];
					ExecuteQuery($sql);
					$sql = "UPDATE history set `other_id` = " . $spouse[0] . ", `processed` = 1 WHERE id = " . $nextaction['id'];
					ExecuteQuery($sql);
				}
				break;
			case 3: //Child
				if ($child_id = CreateChild($actor)) {
					$sql = "Update history set other_id = $child_id, processed = 1 WHERE id = " . $nextaction['id'];
					ExecuteQuery($sql);
					while (mt_rand(1, 100) == 1) {
						if ($child_id = CreateChild($actor)) {
							$sql = "INSERT INTO history set "
									. "person_id = " . $nextaction['person_id'] . ", "
									. "action_id = " . $nextaction['person_id'] . ", "
									. "year = " . getData('currentyear') . ", "
									. "occurrence = '" . $nextaction['occurrence'] . "', "
									. "other_id = " . $child_id . ", "
									. "processed = 1";
							ExecuteQuery($sql);
						} else {
							die("Unable to create a twin/triplet");
						}
					}
					$age = getData('currentyear') - $actor['birthyear'];
					$lastchance = min($actor['fertility'], $actor['lifespan']) - $actor['birthyear'];
					$nextchild = GetNextChildAge($age, $lastchance);
					$sql = "UPDATE people SET nextchild = $nextchild WHERE id = " . $actor['id'];
					ExecuteQuery($sql);
				} else {
					die("Unable to create a new child");
				}
				break;
			case 4: //Infertile
				$sql = "UPDATE people SET nextchild = 0, infertile = 1 WHERE id = " . $actor['id'];
				ExecuteQuery($sql);
				$sql = "Update history set processed = 1 WHERE id = " . $nextaction['id'];
				ExecuteQuery($sql);
				break;
			case 5: // Deceased
				$sql = "UPDATE people SET deceased = 1 WHERE id = " . $actor['id'];
				ExecuteQuery($sql);
				$sql = "Update history set processed = 1 WHERE id = " . $nextaction['id'];
				ExecuteQuery($sql);
				break;
			default:
				//Error, should have a value
				break;
		}


		$currentpopulation += 1;
		echoline($currentpopulation, "Current population: ");
//	$currentpopulation = $link->query("SELECT count(*) as cid from people where deceased = 0")->fetch(PDO::FETCH_ASSOC)['cid'];
	}
	echoline($maxpopulation, "Maximum population reached");
} else {
	echoline("no surviving population");
}

//$link->query("COMMIT");
//while ($currentyear < 10) {
//	$year = new Year($currentyear);
//	$currentyear = $year->ExecuteYear();
//	unset($year);
//	$sql = "SELECT id FROM people WHERE deceased = 0";
//	$population = $link->query($sql)->rowCount();
//	echoline("Year: $currentyear - Population: " . $population);
//	if ($population == 0) {
//		echoline("Colony Failed");
//	}
//}
//$testmother = new Person(13);
//$closest_id = $testmother->GetClosestMaleToAge($testmother->age, true);
//echoline($closest_id);
//$output = [];
//for ($ctr = 15; $ctr <= 45; $ctr++) {
//	$output[$ctr] = 0;
//}
//for ($ctr = 0; $ctr < 100000; $ctr++) {
////	$value = purebell(15, 45, 4);
//	$value = 14 + mt_rand(1,10) + mt_rand(1,10) + mt_rand(1,5) + mt_rand(1,5) + mt_rand(1,5)  - 4;
//	$output[$value] += 1;
//}
//pr($output);


echoline("Process Complete");
$endtime = microtime(true);
echoline($endtime - $starttime, "Elapsed Time");
