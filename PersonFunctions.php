
<?php

function GetMaleSpouse($person) {
	echoline("GetMaleSpouse");
	$spouse = [];
	$spouse['marriage'] = getData('currentyear');
	$spouse['spouse_id'] = $person['id'];
	$gender = 0;
	$spouse['birthyear'] = $person['birthyear'] + Get2d6ExplodeOnce() - 4;
	if ($closest = GetClosestMaleToAge(['birthyear' => $spouse['birthyear']])) {
//		pr($closest);
		$id = $closest['id'];
		$spouse['id'] = $id;
		$familyname = $closest['familyname'];
//		echoline($id, "Spouse found");
		CreateHistory($spouse);
		$sql = "UPDATE people set `spouse_id` = " . $person['id'] . " WHERE id = $id";
		if (!ExecuteQuery($sql)) {
			echoline($sql, "sql", true);
			echoline("Update spouse with person id failed");
		}
	} else {
		echoline("Create New Spouse Here");
		if (!empty($person['nextchild'])) {
			$minage = $person['nextchild'] - $spouse['birthyear'];
		} else {
			$minage = getData('currentyear') - $spouse['birthyear'];
		}
		$spouse['lifespan'] = GetAgeFromRoll('harnage', [$minage, 100]) + $spouse['birthyear'];
		$sql = "SELECT GetRandomFamilyName() AS familyname FROM people LIMIT 1";
		if ($result = ExecuteQuery($sql)) {
			$familyname = $result[0]['familyname'];
			$spouse['familyname'] = $familyname;
//			echoline($familyname);
		}else{
			echoline("Unable select a random family name");
			pr($result);
		}
		$sql = "INSERT INTO people (`familyname`,`gender`,`birthyear`,`marriage`,`spouse_id`,`lifespan`) VALUES ";
		$sql .= "('$familyname',0," . $spouse['birthyear'] . "," . getData('currentyear') . "," . $person['id'] . "," . $spouse['lifespan'] . ")";
//		echoline($sql, "Creating new spouse");
		if ($id = ExecuteQuery($sql)) {
			$spouse['id'] = $id;
			CreateHistory($spouse);
		} else {
			echoline("Query failed with no information", "", true);
		}
	}
	if(empty($id)){
//		echoline($sql, "sql", true);
		pr($person);
		die("id not set in GetMaleSpouse");
	}
	if(empty($familyname)){
//		echoline($sql, "sql", true);
		pr($person);
		die("familyname not set in GetMaleSpouse");
	}
	return([$id, $familyname]);
}

function CreateFemale($start = false) {
	echoline("CreateFemale");
	$db = Db::getInstance();
	$link = $db->getConnection();
	$age = getAgeFromRoll('harnage', $start ? [15, 20] : []);
	$birthyear = getData("currentyear") - $age;
	$lifespan = $newfemale['lifespan'] = GetLifespan($age);
	$fertility = GetInfertility($age, $lifespan, $start);
	$nextchild = GetNextChildAge($age, min($lifespan, $fertility), $start);
	$marriage = GetAgeFromRoll('harnage', [$age, $nextchild]);
	$newfemale = [];
	$newfemale['gender'] = 1;
	$newfemale['birthyear'] = getData("currentyear") - $age;
	$newfemale['lifespan'] = $lifespan + $birthyear;
	$newfemale['fertility'] = $fertility + $birthyear;
	$newfemale['nextchild'] = $nextchild + $birthyear;
	$newfemale['marriage'] = $marriage + $birthyear;
	$columns = [];
	$values = [];
	foreach ($newfemale as $key => $value) {
		$columns[] = $key;
		$values[] = $value;
	}

	$sql = "INSERT INTO `people` (`" . implode("`,`", $columns) . "`) VALUES (" . implode(",", $values) . ")";
	if($id = ExecuteQuery($sql)){
		$newfemale['id'] = $id;
		CreateHistory($newfemale);
	}

	return($id);
}

function GetLifespan($minage = false) {
//	echoline("GetLifespan");
	if ($minage) {
		return getAgeFromRoll('harnlifespan', [$minage, getTableRange('harnlifespan', 'age')[1]]);
	} else {
		return getAgeFromRoll('harnlifespan');
	}
}

function GetInfertility($age, $lifespan, $force = false) {
//	echoline("GetInfertility");
	if ($force) {
//		echoline($age, "age");
//		echoline($lifespan, "lifespan");
		$fertility = getAgeFromRoll('harnfertility', [$age, $lifespan]);
	} else {
		$fertility = GetAgeFromRoll('harnfertility');
	}
//	echoline($fertility, "Infertility Age");
	if ($fertility > $lifespan) {
		return false;
	}
	return $fertility;
}

function CreateChild($mother) {
	echoline("CreateChild");
	$child = [];
	$child['gender'] = mt_rand(0, 1);
	$child['mother_id'] = $mother['id'];
	$child['birthyear'] = getData('currentyear');
	if ($father = GetFatherID($mother)) {
		$child['father_id'] = $father['id'];
		$bastard = 1;
	} else {
		$child['father_id'] = $mother['spouse_id'];
		$child['familyname'] = $mother['familyname'];
	}
//	echoline("Father Selected");
	$child['lifespan'] = getAgeFromRoll('harnlifespan') + $child['birthyear'];
//	pr($child);
	if ($child['gender'] == 1) {
		if ($child['fertility'] = GetInfertility($child['birthyear'], $child['lifespan'])) {
			if ($child['nextchild'] = GetNextChildAge($child['birthyear'], $child['fertility'])) {
				$child['marriage'] = getAgeFromRoll('harnage', [16, $child['nextchild'] - $child['birthyear']]);
			} else {
				unset($child['nextchild']);
			}
		} else {
			unset($child['fertility']);
		}
	}
//	pr($child);
	foreach ($child as $key => $value) {
		$columns[] = $key;
		$values[] = $value;
	}
	$sql = "INSERT INTO `people` (`" . implode("`,`", $columns) . "`) VALUES ('" . implode("','", $values) . "')";
//	echoline($sql, "adding a child", true);
	if ($id = ExecuteQuery($sql)) {
		$child['id'] = $id;
		CreateHistory($child);
	} else {
		echoline("Child insert into people failed");
	}
	$sql = "UPDATE people set childcount = ifnull(`childcount`,0) + 1 WHERE id = " . $mother['id'];
	if(ExecuteQuery($sql) === false){
		echoline($sql, "Failing query");
		die("Failed to update child count");
	}
	return($id);
}

function GetNextChildAge($age, $lastchance, $force = false) {
//	echoline("GetNextChildAge");
	if ($age < 15) {
		$d1 = mt_rand(1, 6);
		$d2 = mt_rand(1, 6);
		$d3 = $d1 == 6 ? mt_rand(1, 6) : 0;
		$d4 = $d2 == 6 ? mt_rand(1, 6) : 0;
		$nextchild = 14 + $d1 + $d2 + $d3 + $d4;
	} else if ($age < 35) {
		$d1 = mt_rand(1, 6);
		$d2 = mt_rand(1, 6);
		if ($d1 == $d2 && $d2 == 1) {
			$nbdiff = 1;
		} else if ($d1 == 1) {
			$nbdiff = min($d2, mt_rand(1, 6));
		} else if ($d2 == 1) {
			$nbdiff = min($d1, mt_rand(1, 6));
		} else {
			$nbdiff = min($d1, $d2);
		}
		$nextchild = $age + $nbdiff;
	} else if ($age < 40) {
		$d1 = mt_rand(1, 10);
		$d2 = mt_rand(1, 20);
		if ($d1 == $d2 && $d2 == 1) {
			$nbdiff = 1;
		} else if ($d1 == 1) {
			$nbdiff = min($d2, mt_rand(1, 10));
		} else if ($d2 == 1) {
			$nbdiff = min($d1, mt_rand(1, 20));
		} else {
			$nbdiff = min($d1, $d2);
		}
		$nextchild = $age + $nbdiff;
	} else {
		$d1 = mt_rand(1, 20);
		$d2 = mt_rand(1, 20);
		if ($d1 == $d2 && $d2 == 1) {
			$nbdiff = 1;
		} else if ($d1 == 1) {
			$nbdiff = min($d2, mt_rand(1, 20));
		} else if ($d2 == 1) {
			$nbdiff = min($d1, mt_rand(1, 20));
		} else {
			$nbdiff = min($d1, $d2);
		}
		$nextchild = $age + $nbdiff;
	}
	if ($force) {
		$nextchild = min($nextchild, $lastchance);
	} else {
		if ($lastchance < $nextchild) {
			$nextchild = 0;
		}
	}
	return $nextchild;
}

function GetFatherID($mother) {
//	echoline("GetFatherID");
	$preferredage = $mother['birthyear'] + Get2d6ExplodeOnce() - 4;
	$params = ['birthyear' => $preferredage, 'allowmarried' => true, 'offset' => 10];
	if ($mother['spouse_id']) { // Married
		if (mt_rand(1, 100) > 50) { // Spouse is father
			return false;
		} else { // Married/Infidelity
			if ($father_id = GetClosestMaleToAge($params)) {
				return $father_id;
			} else {
				return false;
			}
		}
	} else { // Unmarried
		if ($father_id = GetClosestMaleToAge($params)) {
			return $father_id;
		} else {
			$params['offset'] = 100;  //Anyone?
			if ($father_id = GetClosestMaleToAge($params)) {
				return $father_id;
			} else {
				echoline("No father found");
				die();
			}
		}
	}
}


//function GetChildren($age, $lastchance) {
//	$nextchild = null;
//	$activeage = 0;
//	$childcount = 0;
//	while ($activeage = GetNextChildAge($activeage, $lastchance)) {
//		$nextchild = $activeage;
//		if ($nextchild < $age) {
//			$childcount += 1;
//		} else {
//			break;
//		}
//	}
//	return([$nextchild, $childcount]);
//}
//function CreatePerson() {
//	$gender = mt_rand(0, 1);
//	$age = getAgeFromRoll('harnage');
//	$lifespan = GetLifespan($age);
//	if ($gender == 1) {
//		$fertility = getAgeFromRoll('harnfertility');
//		$children = getChildren($age, min($lifespan, $fertility));
//		$nextchild = $children[0];
//		$childcount = $children[1];
//	} else {
//		$fertility = null;
//		$nextchild = null;
//		$childcount = null;
//	}
////	$givenname = getRandomFirstName($gender);
//	return([
//		'gender' => $gender,
//		'age' => $age,
//		'lifespan' => $lifespan,
//		'fertility' => $fertility,
//		'nextchild' => $nextchild,
//		'childcount' => $childcount
////		'givenname' => $givenname
//			]);
//}
//	function SetAge() {
//		//echoline($minage, "minage");
//		//echoline($maxage, "maxage");
//		$lowroll = getData('harnage')[$minage]['start'];
//		$highroll = getData('harnage')[$maxage]['end'];
//		$baseage = mt_rand($lowroll, $highroll);
//		$age = getAgeFromRoll('harnage', $baseage);
//		//echoline($age, "age");
//	}
//
	/*

	  //	function CreatePerson($year, $force = false) {
	  //		$gender = is_null($defaultgender) ? mt_rand(0, 1) : $defaultgender;
	  //		$age = $GetAge();
	  //		$birthyear = $year - $age;
	  //		$GetLifespan($force);
	  //		$SetNames($mother);
	  //	}
	  //
	  function CreateFather($year, $mother_id) {
	  $mother = new Person($mother_id);
	  $gender = 0;
	  $age = $mother->age + $Get2d6() - 4;
	  $birthyear = $year - $age;
	  //		echoline($mother->age, "mother age");
	  //		echoline($age, "father age");
	  $minlifespan = $age + ($mother->nextchild - $mother->age);
	  if ($minlifespan < 15) {
	  echoline($minlifespan, "minlifespan");
	  pr($mother);
	  }
	  $GetLifespan();
	  //		echoline($lifespan, "father lifespan");
	  $spouse_id = $mother_id;
	  $setNames();
	  return $SavePersonToDB();
	  }

	  function SavePersonToDB() {
	  //TODO: Add field validation
	  $reflect = new ReflectionClass($this);
	  $ovars = $reflect->getProperties(ReflectionProperty::IS_PUBLIC);
	  $gender = 'gender';
	  $columns = "";
	  $values = "";
	  $update = "";
	  foreach ($ovars as $ovar) {
	  $okey = $ovar->getName();
	  $ovalue = $$okey;
	  if ($ovalue !== null) {
	  if ($columns) {
	  $columns .= ",";
	  }
	  $columns .= "`" . $okey . "`";
	  if ($values) {
	  $values .= ",";
	  }
	  $ovout = $link->quote($ovalue);
	  $values .= $ovout;
	  if ($update) {
	  $update .= ",";
	  }
	  $update .= "`" . $okey . "` = " . $ovout;
	  }
	  }
	  $sql = "INSERT INTO `people` ($columns) VALUES ($values) ON DUPLICATE KEY UPDATE $update";
	  //		echoline($sql);
	  $link->query($sql);
	  if ($link->errorinfo()[0] != '00000') {
	  pr($link->errorinfo());
	  }
	  $id = $link->lastInsertId();
	  $id = $id;
	  return($id);
	  }

	  function LoadPerson($person_id) {
	  //TODO: Add field validation
	  //		$reflect = new ReflectionClass($this);
	  //		$ovars = $reflect->getProperties(ReflectionProperty::IS_PUBLIC);
	  //		pr($ovars);
	  $sql = "SELECT * FROM people WHERE id = $person_id";
	  $person = $link->query($sql)->fetch(PDO::FETCH_OBJ);
	  //		pr($person);
	  foreach ($person as $pkey => $pvalue) {
	  $$pkey = $pvalue;
	  }
	  }

	  function Get2d6() {
	  $d1 = mt_rand(1, 6);
	  $d2 = mt_rand(1, 6);
	  $d3 = $d1 == 6 ? mt_rand(1, 6) : 0;
	  $d4 = $d2 == 6 ? mt_rand(1, 6) : 0;
	  return $d1 + $d2 + $d3 + $d4;
	  }

	  function GetFatherID() {
	  $minage = 20;
	  $maxage = 45;
	  $preferredage = $GetAge();
	  if ($spouse_id) { // Married
	  if (mt_rand(1, 100) > $infidelity) { // Spouse is father
	  return false;
	  } else { // Married/Infidelity
	  if ($father_id = GetClosestMaleToAge($preferredage, true)) {
	  $father_id = $father_id;
	  } else {
	  echoline("No father found");
	  die();
	  }
	  }
	  } else { // Unmarried
	  if ($father_id = GetClosestMaleToAge($preferredage, true)) {
	  return $father_id;
	  } else {
	  echoline("No father found");
	  die();
	  }
	  }
	  }

	  function SetNames() {
	  $givenname = "given" . mt_rand(10, 50);
	  $familyname = "family" . mt_rand(51, 99);

	  // Set names based on existing information
	  }
	 */
	