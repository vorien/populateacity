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




$harnage = $link->query("SELECT age, start,end FROM HarnAge")->fetchAll(PDO::FETCH_ASSOC);
$harnlifespan = $link->query("SELECT age, start, end FROM HarnLifespan")->fetchAll(PDO::FETCH_ASSOC);
$harnfertilityzero = $link->query("SELECT age, start, end FROM HarnFertility")->fetchAll(PDO::FETCH_ASSOC);
foreach ($harnfertilityzero as $key => $value) {
	$harnfertility[$key + 15] = $value;
}
$femalenameslist = $link->query("SELECT id, name from firstnames_female order by id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($femalenameslist as $key => $value) {
	$femalenames[$key + 1] = $value;
}
$malenameslist = $link->query("SELECT id, name from firstnames_male order by id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($malenameslist as $key => $value) {
	$malenames[$key + 1] = $value;
}
//pr($femalenames);
//pr($malenames);


$link = $db->getConnection();
$sql = "TRUNCATE TABLE people";
$link->query($sql);
$sql = "TRUNCATE TABLE history";
$link->query($sql);


setData('harnage', $harnage);
setData('harnlifespan', $harnlifespan);
setData('harnfertility', $harnfertility);
setData('femalenames', $femalenames);
setData('malenames', $malenames);

$startingpopulation = 10000;
$currentyear = 0;
$dumpmax = 300;

$sql = "TRUNCATE TABLE people";
$link->query($sql);
$sql = "TRUNCATE TABLE history";
$link->query($sql);

//$link->query("START TRANSACTION");
$dumpctr = 0;
$savelist = [];
for ($ctr = 0; $ctr < ($startingpopulation); $ctr++) {
	$newperson = CreatePerson();
	$savelist[] = $newperson;
	$dumpctr += 1;
	if ($dumpctr >= $dumpmax) {
//		echoline("Prepping Dump at $ctr");
		$sql = buildInsertQuery('people', $savelist);
//		echoline($sql);
		$link->query($sql);
		$dumpctr = 0;
		$savelist = [];
		set_time_limit(60);
	}
}
if ($savelist) {
//	echoline("Prepping Final Dump at $ctr");
	$sql = buildInsertQuery('people', $savelist);
//		echoline($sql);
	$link->query($sql);
	set_time_limit(60);
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
