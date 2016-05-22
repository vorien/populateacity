
<?php

class Person {

	public $id;
	public $givenname;
	public $familyname;
	public $mother_id;
	public $father_id;
	public $gender;
	public $birthyear;
	public $age;
	public $deceased;
	public $lifespan;
	public $infertile;
	public $nextchild;
	public $bastard;
	public $spouse_id;
	public $lostspouse;
	private $link;
	private $mother;
	private $minage = 0;
	private $maxage = 81;
	private $minfertility = 15;
	private $maxfertility = 55;
	private $minlifespan = 0;
	private $maxlifespan = 87;
	private $defaultgender = null;
	private $infidelity = 5;

	function __construct($person_id = null) {
$db = Db::getInstance();
$this->link = $db->getConnection();
		if (!empty($person_id)) {
			$this->LoadPerson($person_id);
		}
	}

	function CreatePerson($year) {
		$this->gender = is_null($this->defaultgender) ? mt_rand(0, 1) : $this->defaultgender;
		$this->SetAge();
		$this->birthyear = $year - $this->age;
		$this->SetLifespan(true);
		if($this->gender == 1){
			$this->SetInfertility();
			$this->SetNextChildAge();
		}
		$this->SetNames();
//		return $this->SavePersonToDB();
	}

	function SetAge() {
		//echoline($this->minage, "minage");
		//echoline($this->maxage, "maxage");
		$lowroll = getData('harnage')[$this->minage]['start'];
		$highroll = getData('harnage')[$this->maxage]['end'];
		$baseage = mt_rand($lowroll, $highroll);
		$this->age = getAgeFromRoll('harnage', $baseage);
		//echoline($this->age, "age");
	}

	public function SetLifespan($force = false) {
		if ($force) {
			$this->minlifespan = $this->age + 1;
		}
		$lowroll = getData('harnlifespan')[$this->minlifespan]['start'];
		$highroll = getData('harnlifespan')[$this->maxlifespan]['end'];
		$baseage = mt_rand($lowroll, $highroll);
		$this->lifespan = getAgeFromRoll('harnlifespan', $baseage);
	}

	public function SetInfertility($force = false) {
		if ($this->gender != 1) {
			return;
		}
		if ($force) {
			$this->minfertility = max($this->minfertility, $this->age);
			$this->maxfertility = min($this->maxfertility, $this->lifespan);
		}
		$lowroll = getData('harnfertility')[$this->minfertility]['start'];
		$highroll = getData('harnfertility')[$this->maxfertility]['end'];
		$baseage = mt_rand($lowroll, $highroll);
		$this->infertile = getAgeFromRoll('harnfertility', $baseage);
	}

	public function SetNextChildAge($force = false) {
		if ($this->gender != 1) {
			return;
		}
		$currentchild = $this->nextchild;
		if ($this->age < 15) {
			$d1 = mt_rand(1, 6);
			$d2 = mt_rand(1, 6);
			$d3 = $d1 == 6 ? mt_rand(1, 6) : 0;
			$d4 = $d2 == 6 ? mt_rand(1, 6) : 0;
			$this->nextchild = 14 + $d1 + $d2 + $d3 + $d4;
		} else if ($this->age < 35) {
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
			$this->nextchild = $this->age + $nbdiff;
		} else if ($this->age < 40) {
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
			$this->nextchild = $this->age + $nbdiff;
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
			$this->nextchild = $this->age + $nbdiff;
		}
		if ($force) {
			$this->nextchild = min($this->nextchild, $this->infertile, $this->lifespan);
		}
	}

	function SetAllToDefault() {
		$this->SetDefaultGender();
		$this->ResetAge();
		$this->ResetFertility();
		$this->ResetLifespan();
	}

	function SetDefaultInfidelity($infidelity = 5) {
		$this->infidelity = $infidelity;
	}

	function SetDefaultGender($gender = null) {
		$this->defaultgender = $gender;
	}

	function ResetAge() {
		$this->minage = 0;
		$this->maxage = 81;
	}

	function SetMinAge($minage) {
		$this->minage = $minage;
	}

	function SetMaxAge($maxage) {
		$this->maxage = $maxage;
	}

	function ResetFertility() {
		$this->minfertility = 15;
		$this->maxfertility = 55;
	}

	function SetMinFertility($minfertility) {
		$this->minfertility = $minfertility;
	}

	function SetMaxFertility($maxfertility) {
		$this->maxfertility = $maxfertility;
	}

	function ResetLifespan() {
		$this->minlifespan = 0;
		$this->maxlifespan = 87;
	}

	function SetMinLifespan($minlifespan) {
		$this->minlifespan = $minlifespan;
	}

	function SetMaxLifespan($maxlifespan) {
		$this->maxlifespan = $maxlifespan;
	}

	function CreateChild($year) {
		$child = new Person();
		$child->gender = is_null($this->defaultgender) ? mt_rand(0, 1) : $this->defaultgender;
		$child->mother_id = $this->id;
		$child->birthyear = $year;
		$child->age = 0;
		if ($father_id = $this->GetFatherID()) {
			$child->father_id = $father_id;
			$child->bastard = 1;
		} else {
			$child->father_id = $this->spouse_id;
		}
		$child->SetLifespan();
		if ($child->lifespan == 0) {
			$child->deceased = 1;
		} else {
			if ($child->gender == 1) {
				$child->SetInfertility();
				$child->SetNextChildAge();
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
//		$this->gender = is_null($this->defaultgender) ? mt_rand(0, 1) : $this->defaultgender;
//		$this->age = $this->GetAge();
//		$this->birthyear = $year - $this->age;
//		$this->SetLifespan($force);
//		$this->SetNames($this->mother);
//	}
//
	function CreateFather($year, $mother_id) {
		$mother = new Person($mother_id);
		$this->gender = 0;
		$this->age = $mother->age + $this->Get2d6() - 4;
		$this->birthyear = $year - $this->age;
//		echoline($mother->age, "mother age");
//		echoline($this->age, "father age");
		$this->minlifespan = $this->age + ($mother->nextchild - $mother->age);
		if ($this->minlifespan < 15) {
			echoline($this->minlifespan, "minlifespan");
			pr($mother);
		}
		$this->SetLifespan();
//		echoline($this->lifespan, "father lifespan");
		$this->spouse_id = $mother_id;
		$this->setNames();
		return $this->SavePersonToDB();
	}

	public function SavePersonToDB() {
		//TODO: Add field validation
		$reflect = new ReflectionClass($this);
		$ovars = $reflect->getProperties(ReflectionProperty::IS_PUBLIC);
		$gender = 'gender';
		$columns = "";
		$values = "";
		$update = "";
		foreach ($ovars as $ovar) {
			$okey = $ovar->getName();
			$ovalue = $this->$okey;
			if ($ovalue !== null) {
				if ($columns) {
					$columns .= ",";
				}
				$columns .= "`" . $okey . "`";
				if ($values) {
					$values .= ",";
				}
				$ovout = $this->link->quote($ovalue);
				$values .= $ovout;
				if ($update) {
					$update .= ",";
				}
				$update .= "`" . $okey . "` = " . $ovout;
			}
		}
		$sql = "INSERT INTO `people` ($columns) VALUES ($values) ON DUPLICATE KEY UPDATE $update";
//		echoline($sql);
		$this->link->query($sql);
		if ($this->link->errorinfo()[0] != '00000') {
			pr($this->link->errorinfo());
		}
		$id = $this->link->lastInsertId();
		$this->id = $id;
		return($id);
	}

	public function LoadPerson($person_id) {
		//TODO: Add field validation
//		$reflect = new ReflectionClass($this);
//		$ovars = $reflect->getProperties(ReflectionProperty::IS_PUBLIC);
//		pr($ovars);
		$sql = "SELECT * FROM people WHERE id = $person_id";
		$person = $this->link->query($sql)->fetch(PDO::FETCH_OBJ);
//		pr($person);
		foreach ($person as $pkey => $pvalue) {
			$this->$pkey = $pvalue;
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
		$this->minage = 20;
		$this->maxage = 45;
		$preferredage = $this->GetAge();
		if ($this->spouse_id) { // Married
			if (mt_rand(1, 100) > $this->infidelity) { // Spouse is father
				return false;
			} else { // Married/Infidelity
				if ($father_id = GetClosestMaleToAge($preferredage, true)) {
					$this->father_id = $father_id;
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
		$this->givenname = "given" . mt_rand(10, 50);
		$this->familyname = "family" . mt_rand(51, 99);

		// Set names based on existing information
	}

}

include_once("GlobalFunctions.php");
include_once("DbClass.php");
include_once("CacheClass.php");
