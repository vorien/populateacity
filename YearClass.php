
<?php


class Year {

	private $year;
	private $link;
	private $marriagableage = 16;

	function __construct($year) {
        $db = Db::getInstance();
        $this->link = $db->getConnection();
		$this->year = $year;
	}

	function ExecuteYear() {
		$sql = "SELECT * FROM people WHERE deceased = 0 ORDER BY age";
		$people = $this->link->query($sql);
		while ($row = $people->fetch(PDO::FETCH_ASSOC)) {
			if($row['gender'] == 1){
				if (empty($row['spouse_id']) && $row['age'] >= $this->marriagableage) {
					//SelectHusband
				}
				if ($row['nextchild'] == $row['age'] && $row['infertile'] >= $row['age']) {
					$person = new Person($row['id']);
					$person->CreateChild($this->year);
					$person->SetNextChildAge();
					$record_id = $person->SavePersonToDB();
					unset($person);
				}
			}
			if ($row['age'] >= $row['lifespan']) {
				$sql = "UPDATE people set deceased = 1 WHERE id = " . $row['id'] . ";";
				$this->link->query($sql);
				$sql .= "UPDATE people set spouse_id = null, lostspouse = lostspouse + 1 WHERE spouse_id = " . $row['id'] . ";";
				$this->link->query($sql);
				History($row['id'], $this->year, "Died");
			} else {
				$sql = "UPDATE people set age = age + 1 WHERE id = " . $row['id'] . ";";
				$this->link->query($sql);
			}
		}
		return $this->year + 1;
	}

	function SetMarriagableage($age) {
		$this->marriagableage = $age;
	}

	function IsMarriageable($age) {
		// TODO:  Add marriagability by age?
		return $this->marriagableage >= $age;
	}

	function GetClosestMaleToAge($age, $allowmarried = false) {
		$sql = "SELECT id, age, ABS( age - $age ) AS distance FROM people WHERE gender = 0 AND deceased = 0";
		if (!$allowmarried) {
			$sql .= " AND spouse_id IS NULL";
		}
		$sql .= " ORDER BY distance LIMIT 1";
		$result = $this->link->query($sql)->fetchObject();
		if ($result->num_rows) {
			return $result->fetch_object()->id;
		} else {
			return null;
		}
	}

}

include_once('GlobalFunctions.php');
include_once('DbClass.php');