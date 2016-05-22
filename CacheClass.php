<?php

class Cache {

	var $iTtl = 600; // Time To Live
	var $useapc = false; // APC enabled

	function __construct() {
		$this->useapc = extension_loaded('apc');
	}

	function setData($sKey, $vData) {
		if ($this->useapc) {
			return apc_store($sKey, $vData, $this->iTtl);
		} else {
			$_SESSION[$sKey] = $vData;
		}
	}

	function getData($sKey) {
		if ($this->useapc) {
			$bRes = false;
			$vData = apc_fetch($sKey, $bRes);
			return ($bRes) ? $vData : null;
		} else {
			return $_SESSION[$sKey];
		}
	}

	function delData($sKey) {
		if ($this->useapc) {
			return (apc_exists($sKey)) ? apc_delete($sKey) : true;
		} else {
			unset($_SESSION[$sKey]);
		}
	}
}

?>
