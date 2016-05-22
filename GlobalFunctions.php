<?php

function buildInsertQuery($table, $records) {
	if (empty($records)) {
		return false;
	}
	$sql = "INSERT INTO `$table` ";
//	pr($records);
	$values = [];
	$keylist = array_keys($records[0]);
	$sql .= " (`" . implode("`,`", $keylist) . "`)";
	$sql .= " VALUES ";
	foreach ($records as $record) {
		$values[] = '("' . implode('","', $record) . '")';
	}
	$sql .= implode(",", $values);
	$sql .= ";";
	$sql = str_replace('""', "null", $sql);
//		echoline($sql);
	return $sql;
}

function getRandomFirstName($gender){
	$tblname = $gender ? 'femalenames' : 'malenames';
	$table = getData($tblname);
	$max = getTableRange($tblname, 'id')[1];
//	echoline($max, 'max');
	$randval = mt_rand(1, $max);
	echoline($randval, 'randval');
//	pr($table[$randval]);
	$name = $table[$randval]['name'];
	return $name;
}

function getAgeFromRoll($table, $minmax = []) {
	if (!$minmax) {
		$minmax = getTableRange($table, 'age');
	}
	$lowroll = getData($table)[$minmax[0]]['start'];
	$highroll = getData($table)[$minmax[1]]['end'];
	$roll = mt_rand($lowroll, $highroll);
	foreach (getData($table) as $key => $value) {
		if ($roll >= $value['start'] && $roll <= $value['end']) {
			return $value['age'];
		}
	}
	return false;
}

function getTableRange($table, $field) {
	$tbl = getData($table);
	ksort($tbl);
	$min = array_shift($tbl)[$field];
	$max = array_pop($tbl)[$field];

	return [$min, $max];
}

function History($id, $year, $occurrence, $other_id = "null") {
//		echoline($id);
//		echoline($year);
//		echoline($occurrence);
//		echoline($other_id);
//	$sql = 'INSERT INTO history (person_id, year, occurrence, other_id) VALUES (' . $id . ', ' . $year . ', "' . $occurrence . '", ' . $other_id . ')';
//		$this->link->query($sql);
}

function GetClosestMaleToAge($age, $allowmarried = false) {
	global $people;
	$closest = null;
	foreach ($people as $person) {
		if ($person->gender != 0 && $person->deceased == 0 && (!$person->spouse_id || $allowmarried)) {

			if ($closest === null || abs($age - $closest) > abs($person->age - $age)) {
				$closest = $person->id;
			}
		}
	}
	return $closest;
}

// Convenience Functions
function pr($array, $debug = false) {
	$output = "<pre>";
	$output .= print_r($array, true);
	$output .= "</pre>";
	$bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5);
	$btline1 = array_shift($bt);
	$btline2 = array_shift($bt);
	$line = $btline1['line'];
	$caller = $btline2['function'];
	$btfile = explode("/", $btline1['file']);
	$file = end($btfile);
	if ($debug) {
		$output .= " (Line $line of function $caller in $file)";
	}
	$output .= "<br>\n";
	echo($output);
}

function echoline($string, $title = null, $debug = false) {
	if (is_array($string)) {
		pr($string);
	} else {
		if ($title) {
			echo($title . ": ");
		}
		$bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5);
		$btline1 = array_shift($bt);
		$btline2 = array_shift($bt);
		$btline3 = array_shift($bt);
		$btline4 = array_shift($bt);
		$line = $btline1['line'];
		$caller = $btline2['function'];
		$btfile = explode("/", $btline1['file']);
//		pr($btline1);
//		pr($btline2);
//		pr($btline3);
//		pr($btline4);
		$file = end($btfile);
		echo($string);
		if ($debug) {
			echo(" (Line $line of function $caller in $file)");
		}
		echo("<br>\n");
		flush();
	}
}

function purebell($min, $max, $std_deviation, $step = 1) {
	$rand1 = (float) mt_rand() / (float) mt_getrandmax();
	$rand2 = (float) mt_rand() / (float) mt_getrandmax();
	$gaussian_number = sqrt(-2 * log($rand1)) * cos(2 * M_PI * $rand2);
	$mean = ($max + $min) / 2;
	$random_number = ($gaussian_number * $std_deviation) + $mean;
	$random_number = round($random_number / $step) * $step;
	if ($random_number < $min || $random_number > $max) {
		echoline($random_number);
		$random_number = purebell($min, $max, $std_deviation);
	}
	return $random_number;
}

// Cache Functions
function setData($sKey, $vData) {
	if (extension_loaded('apc')) {
		return apc_store($sKey, $vData, 600);
	} else {
		$_SESSION[$sKey] = $vData;
	}
}

function getData($sKey) {
	if (extension_loaded('apc')) {
		$bRes = false;
		$vData = apc_fetch($sKey, $bRes);
		return ($bRes) ? $vData : null;
	} else {
		return $_SESSION[$sKey];
	}
}

function delData($sKey) {
	if (extension_loaded('apc')) {
		return (apc_exists($sKey)) ? apc_delete($sKey) : true;
	} else {
		unset($_SESSION[$sKey]);
	}
}

function removeByKey(&$array, $keys) {
	if (is_array($array)) {
		foreach ($array as $key => &$value) {
			if (is_array($value)) {
				$this->removeByKey($value, $keys);
			} else {
				if (in_array($key, $keys)) {
					unset($array[$key]);
				}
			}
		}
	}
}

function objectToArray($d) {
	if (is_object($d)) {
		// Gets the properties of the given object
		// with get_object_vars function
		$d = get_object_vars($d);
	}

	if (is_array($d)) {
		/*
		 * Return array converted to object
		 * Using __FUNCTION__ (Magic constant)
		 * for recursive call
		 */
		return array_map(__FUNCTION__, $d);
	} else {
		// Return array
		return $d;
	}
}

?>
