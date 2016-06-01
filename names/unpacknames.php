<?php

error_reporting(-1);
ini_set('display_errors', 'On');

include_once("GlobalFunctions.php");

$dirname = dirname(__FILE__) . '/givennames';
$dir = new DirectoryIterator($dirname);

if (($writehandle = fopen("allyears.csv", "w")) === FALSE) {
	die("Unable to open file for writing");
}
fwrite($writehandle,"year,name,gender,qty\n");
foreach ($dir as $fileinfo) {
	$extension = strtolower($fileinfo->getExtension());
	if (!$fileinfo->isDot() && $extension != "pdf") {
		$filename = $fileinfo->getPathname();
		$basename = $fileinfo->getBasename();
//		if ($basename == "yob2006.txt") {
			$year = substr($fileinfo->getBasename(), 3, 4);
			if (($readhandle = fopen($filename, "r")) === FALSE) {
				die("Unable to open $filename for reading.");
			}
			while (!feof($readhandle)) {
				$content = fgets($readhandle);
				if(strlen($content) > 5){
					$output = $year . "," . $content;
					fwrite($writehandle, $output);
				}
			}
			fclose($readhandle);
//		}
	}
}
fclose($writehandle);

echoline("allyears created");
