<?php 
/* Original code: https://github.com/chillly/plaques/blob/master/ajax/ajxplaques.php
 * 
 * Created by Chris Hill <osm@raggedred.net> and contributors.
 * Adapted for Wiki Loves Monuments by Emijrp <emijrp@gmail.com>
 * 
 * This software and associated documentation files (the "Software") is
 * released under the CC0 Public Domain Dedication, version 1.0, as
 * published by Creative Commons. To the extent possible under law, the
 * author(s) have dedicated all copyright and related and neighboring
 * rights to the Software to the public domain worldwide. The Software is
 * distributed WITHOUT ANY WARRANTY.
 * 
 * If you did not receive a copy of the CC0 Public Domain Dedication
 * along with the Software, see
 * <http://creativecommons.org/publicdomain/zero/1.0/>
 */

// uncomment below to turn error reporting on
ini_set('display_errors', 1);
error_reporting(E_ALL);

/*
 * ajaxcoverage.php
 * returns image points as geojson 
 */

if (isset($_GET['bbox'])) {
    $bbox=$_GET['bbox'];
} else {
    // invalid request
    $ajaxres=array();
    $ajaxres['resp']=4;
    $ajaxres['dberror']=0;
    $ajaxres['msg']='missing bounding box';
    sendajax($ajaxres);
}
// split the bbox into it's parts
list($left,$bottom,$right,$top)=explode(",",$bbox);
// open the database
$dbmycnf = parse_ini_file("../replica.my.cnf");
$dbuser = $dbmycnf['user'];
$dbpass = $dbmycnf['password'];
unset($dbmycnf);
$dbhost = "commonswiki.labsdb";
$dbname = "commonswiki_p";

try {
    $db = new PDO('mysql:host='.$dbhost.';dbname='.$dbname.';charset=utf8', $dbuser, $dbpass);
} catch(PDOException $e) {
    // send the PDOException message
    $ajaxres=array();
    $ajaxres['resp']=40;
    $ajaxres['dberror']=$e->getCode();
    $ajaxres['msg']=$e->getMessage();
    sendajax($ajaxres);
}

try {
    $limit = 20000;
    $sql="SELECT gt_lat, gt_lon FROM geo_tags WHERE gt_lon>=:left AND gt_lon<=:right AND gt_lat>=:bottom AND gt_lat<=:top LIMIT ".$limit;
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':left', $left, PDO::PARAM_STR);
    $stmt->bindParam(':right', $right, PDO::PARAM_STR);
    $stmt->bindParam(':bottom', $bottom, PDO::PARAM_STR);
    $stmt->bindParam(':top', $top, PDO::PARAM_STR);
    $stmt->execute();
} catch(PDOException $e) {
    // send the PDOException message
    $ajaxres=array();
    $ajaxres['resp']=40;
    $ajaxres['dberror']=$e->getCode();
    $ajaxres['msg']=$e->getMessage();
    sendajax($ajaxres);
}

$ajaxres=array(); // place to store the geojson result

// go through the list adding each one to the array to be returned    
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $coords=array();
    $coords[0]=floatval($row['gt_lat']);
    $coords[1]=floatval($row['gt_lon']);
    $ajaxres[]=$coords;
}

// tidy up the DB
$db = null;
sendajax($ajaxres); // no return from there

function sendajax($ajax) {
    // encode the ajx array as json and return it.
    $encoded = json_encode($ajax);
    exit($encoded);
}
?>
