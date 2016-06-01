<?php

function GetIdOrNull($array, $key) {
	if (array_key_exists($key, $array)) {
		return $array[$key];
	} else {
		return "'null'";
	}
}

function CreateHistory($person) {
	echoline("CreateHistory");

	$checkfields = ['id', 'birthyear', 'lifespan'];
	foreach ($checkfields as $field) {
		if (empty($person[$field])) {
			pr($person);
			die("CreateHistory field $field not set correctly");
		}
	}
	$sql = "INSERT INTO `history` (`" . implode("`,`", getData('history')) . "`) VALUES ";
	$values = [];
	$actions = getData('actions');
	foreach ($actions as $key => $value) {
		$year = $other = "'null'";
		if (array_key_exists($key, $person)) {
			$year = $person[$key];
			if (array_key_exists($value[2], $person)) {
				$other = $person[$value[2]];
				$processed = 1;
			} else {
				$processed = $actions[$key][3];
			}
			$values[] = "(" . $person['id'] . ", " . $actions[$key][0] . ", " . $year . ", '" . $actions[$key][1] . "', " . $other . "," . $processed . ")";
		}
	}
	if (!empty($values)) {
		$sql .= implode(",", $values);
//		echoline($sql, "adding history");
//		if($actions[$key] == 'Child'){
//			echoline($sql, "Adding nextchild to history");
//		}
		if (!ExecuteQuery($sql)) {
			echoline("History inserts failed");
			return false;
		}
	} else {
		// No history to add
	}
	return true;
}

function ExecuteQuery($sql, $type = null) {
	if (strlen(trim($sql)) < 10) {
		die("No sql query attached");
		return false;
	}

	if (!$type) {
		$type = strtok($sql, " ");
	}

	$db = Db::getInstance();
	$link = $db->getConnection();

	$returnval = $link->query($sql);
	if ($link->errorinfo()[0] != '00000') {
		echoline($sql, "Query with error");
		pr($link->errorinfo());
		return false;
	}

	if ($returnval->rowCount() === 0 || $returnval === FALSE) {
		return false;
	} else {
		switch (strtoupper($type)) {
			case "SELECT":
				return $returnval->fetchAll(PDO::FETCH_ASSOC);
				break;
			case "INSERT":
				return $link->lastInsertId();
				break;
			case "UPDATE":
				return true;
				break;
			default:
				die("Unknown query type");
		}
	}
}

function Get2d6ExplodeOnce() {
	$d1 = mt_rand(1, 6);
	$d2 = mt_rand(1, 6);
	$d3 = $d1 == 6 ? mt_rand(1, 6) : 0;
	$d4 = $d2 == 6 ? mt_rand(1, 6) : 0;
	return $d1 + $d2 + $d3 + $d4;
}

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

function getRandomFirstName($gender) {
	$tblname = $gender ? 'femalenames' : 'malenames';
	$table = getData($tblname);
	$max = getTableRange($tblname, 'id')[1];
//	echoline($max, 'max');
	$randval = mt_rand(1, $max);
//	echoline($randval, 'randval');
//	pr($table[$randval]);
	$name = $table[$randval]['name'];
	return $name;
}

function getAgeFromRoll($table, $minmax = []) {
	$agerange = getTableRange($table, 'age');
//	pr($agerange);
	if (empty($minmax)) {
		$min = $agerange[0];
		$max = $agerange[1];
	} else {
		$min = max($minmax[0], $agerange[0]);
		$max = min($minmax[1], $agerange[1]);
	}
	if ($min > $max) {
		return false;
	}
	$lowroll = getData($table)[$min]['start'];
	$highroll = getData($table)[$max]['end'];
//	echoline($lowroll, "lowroll");
//	echoline($highroll, "highroll");
	$roll = mt_rand($lowroll, $highroll);
//	echoline($roll, "roll");
	foreach (getData($table) as $key => $value) {
		if ($roll >= $value['start'] && $roll <= $value['end']) {
			return $value['age'];
		}
	}
	return false;
}

function getTableRange($table, $field) {
//	echoline($table, "getTableRange - table");
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

function GetClosestMaleToAge($array) {
	echoline("GetClosestMaleToAge");
	if (!isset($array['birthyear'])) {
		return false;
	}
	$defaults = ['offset' => 4, 'lifespan' => 0, 'allowmarried' => false];
	$parameters = array_merge($defaults, $array);
//	pr($parameters);
	$sql = "SELECT   id, birthyear, gender, familyname, ABS(birthyear - " . $parameters['birthyear'] . ") AS distance_from_test FROM people";
	$sql .= " WHERE gender = 0";
	if (!$parameters['allowmarried']) {
		$sql .= " AND spouse_id IS NULL";
	}
	$sql .=" and birthyear > 15 - " . getData('currentyear') . " and lifespan >= " . $parameters['lifespan'];
	$sql .= " HAVING distance_from_test < " . $parameters['offset'];
	$sql .= " ORDER BY distance_from_test";
	$sql .= " LIMIT 1;";
	if ($closest = ExecuteQuery($sql)) {
		return $closest[0];
	}
	return false;
}

// Convenience Functions
function pr($array, $debug = true) {
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
