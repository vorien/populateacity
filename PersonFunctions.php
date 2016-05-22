
<?php

function CreatePerson() {
	$gender = mt_rand(0, 1);
	$age = getAgeFromRoll('harnage');
	$lifespan = GetLifespan($age);
	if ($gender == 1) {
		$infertile = getAgeFromRoll('harnfertility');
		$children = getChildren($age, min($lifespan, $infertile));
		$nextchild = $children[0];
		$childcount = $children[1];
	} else {
		$infertile = null;
		$nextchild = null;
		$childcount = null;
	}
//	$givenname = getRandomFirstName($gender);
	return([
		'gender' => $gender,
		'age' => $age,
		'lifespan' => $lifespan,
		'infertile' => $infertile,
		'nextchild' => $nextchild,
		'childcount' => $childcount
//		'givenname' => $givenname
			]);
}

function GetLifespan($minage = false) {
	if ($minage) {
		return getAgeFromRoll('harnlifespan', [$minage, getTableRange('harnlifespan','age')[1]]);
	} else {
		return getAgeFromRoll('harnlifespan');
	}
}

function GetChildren($age, $lastchance){
		$nextchild = null;
		$activeage = 0;
		$childcount = 0;
		while ($activeage = GetNextChildAge($activeage, $lastchance)) {
			$nextchild = $activeage;
			if($nextchild < $age){
			$childcount += 1;
			}else{
				break;
			}
		}
		return([$nextchild, $childcount]);
}

function GetNextChildAge($age, $lastchance, $force = false) {
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
			$nextchild = false;
		}
	}
	return $nextchild;
}

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
//	function SetInfertility($force = false) {
//		if ($gender != 1) {
//			return;
//		}
//		if ($force) {
//			$minfertility = max($minfertility, $age);
//			$maxfertility = min($maxfertility, $lifespan);
//		}
//		$lowroll = getData('harnfertility')[$minfertility]['start'];
//		$highroll = getData('harnfertility')[$maxfertility]['end'];
//		$baseage = mt_rand($lowroll, $highroll);
//		$infertile = getAgeFromRoll('harnfertility', $baseage);
//	}
//
/*
	function CreateChild($year) {
		$child = new Person();
		$child->gender = is_null($defaultgender) ? mt_rand(0, 1) : $defaultgender;
		$child->mother_id = $id;
		$child->birthyear = $year;
		$child->age = 0;
		if ($father_id = $GetFatherID()) {
			$child->father_id = $father_id;
			$child->bastard = 1;
		} else {
			$child->father_id = $spouse_id;
		}
		$child->GetLifespan();
		if ($child->lifespan == 0) {
			$child->deceased = 1;
		} else {
			if ($child->gender == 1) {
				$child->SetInfertility();
				$child->GetNextChildAge();
			}
			$child->setNames();
		}
		$child->SavePersonToDB();
		History($child->id, $year, "Born");
		if ($child->deceased == 1) {
			History($child->id, $year, "Died at birth");
		}
		unset($child);
	}

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
