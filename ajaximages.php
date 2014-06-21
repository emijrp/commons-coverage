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
 
ini_set('display_errors', 1);
error_reporting(E_ALL);

/*
 * ajaxmonuments.php
 * returns monuments points as geojson 
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

// get featured and quality images for this region
try {
    $sql="SELECT page_title, cl_to FROM geo_tags, page, categorylinks WHERE gt_page_id=page_id AND cl_from=page_id AND page_namespace=6 AND gt_lon>=:left AND gt_lon<=:right AND gt_lat>=:bottom AND gt_lat<=:top AND (cl_to='Featured_pictures_on_Wikimedia_Commons' OR cl_to='Quality_images')";
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

$featured=array();
$quality=array();

// go through the list adding each one to the array to be returned    
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $page_title=$row['page_title'];
    $cl_to=$row['cl_to'];
    
    if ($cl_to == 'Featured_pictures_on_Wikimedia_Commons') {
        $featured[]=$page_title;
    }else if ($cl_to == 'Quality_images') {
        $quality[]=$page_title;
    }
}

// get all images for this region
try {
    $limit = 250;
    $sql="SELECT page_title, gt_lat, gt_lon, page_random FROM geo_tags, page WHERE gt_page_id=page_id AND page_namespace=6 AND gt_lon>=:left AND gt_lon<=:right AND gt_lat>=:bottom AND gt_lat<=:top ORDER BY page_random LIMIT ".$limit;
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
$features=array(); // array to build up the feature collection
$ajaxres['type']='FeatureCollection';

// go through the list adding each one to the array to be returned    
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $lat=$row['gt_lat'];
    $lon=$row['gt_lon'];
    
    $prop=array();
    $prop['image']=str_replace(' ', '_', $row['page_title']);
    $prop['md5']=substr(md5($prop['image']),0,2);
    if (in_array($prop['image'], $featured)){
        $prop['featured']=1;
    }else{
        $prop['featured']=0;
    }
    if (in_array($prop['image'], $quality)){
        $prop['quality']=1;
    }else{
        $prop['quality']=0;
    }

    $f=array();
    $geom=array();
    $coords=array();
    
    $geom['type']='Point';
    $coords[0]=floatval($lon);
    $coords[1]=floatval($lat);
    $geom['coordinates']=$coords;
    
    $f['type']='Feature';
    $f['geometry']=$geom;
    $f['properties']=$prop;

    $features[]=$f;
}

// add the features array to the end of the ajxres array
$ajaxres['features']=$features;
// tidy up the DB
$db = null;
sendajax($ajaxres); // no return from there

function sendajax($ajax) {
    // encode the ajx array as json and return it.
    $encoded = json_encode($ajax);
    exit($encoded);
}
?>
