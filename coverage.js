/*
 * Original code: https://github.com/chillly/plaques/blob/master/example3.js
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
 
var map; // global map object
var layerOSM; // the Mapnik base layer of the map
var layerCoverage; // the geoJson layer to display monuments with

// when the whole document has loaded call the init function
$(document).ready(init);

function init() {
    // map stuff
    // base layer
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';    
    var osmAttrib='Map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors | <a href="https://commons.wikimedia.org/" target="_blank">Images database</a> by Commons editors | <a href="https://github.com/emijrp/commons-coverage" target="_blank">Source code</a> in GitHub';
    
    layerOSM = new L.TileLayer(osmUrl, {
        minZoom: 2, 
        maxZoom: 19, 
        attribution: osmAttrib,
    });

    layerCoverage = new L.TileLayer.MaskCanvas({opacity: 0.5, radius: 500, useAbsoluteRadius: true});
    
    layerImages = L.geoJson(null, {
        pointToLayer: setImage,
        }
    );
    
    // set the starting location for the centre of the map
    var start = new L.LatLng(0, 0);    
    
    // create the map
    map = new L.Map('mapdiv', {        // use the div called mapdiv
        center: start,                // centre the map as above
        zoom: 2,                    // start up zoom level
        layers: [layerOSM,layerImages]        // layers to add 
    });
    L.control.scale().addTo(map);

    layerCoverage.setData([[89,-179],[-89,179]]);
    map.fitBounds(layerCoverage.bounds);
    map.addLayer(layerCoverage);

    // create a layer control
    // add the base layers
    var baseLayers = {
        "OpenStreetMap": layerOSM
    };

    // add the overlays
    var overlays = {
        "Coverage": layerCoverage,
        'Images': layerImages,
    };
    
    // add the layers to a layer control
    L.control.layers(baseLayers, overlays).addTo(map);
    
    var osmGeocoder = new L.Control.OSMGeocoder();
    map.addControl(osmGeocoder);
    var hash = new L.Hash(map);
    
    map.on('moveend', whenMapMoves);
    askForCoverage();
    askForImages();
}

function whenMapMoves(e) {
    askForCoverage();
    askForImages();
}

function setImage(feature,latlng) {
    var image;
    var popuptext;
    var thumb_url;
    
    thumb_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + feature.properties.md5.substring(0,1) + '/' + feature.properties.md5.substring(0,2) + '/' + feature.properties.image + '/150px-' + feature.properties.image;
    popuptext = '<table border=0>';
    popuptext = popuptext + '<tr><td>'+feature.properties.image.replace(/_/g,' ')+'</td></tr>';
    popuptext = popuptext + '<tr><td><a href="https://commons.wikimedia.org/wiki/File:'+feature.properties.image+'" target="_blank"><img src="'+thumb_url+'" /></a></td></tr>';
    popuptext = popuptext + '</table>';
    image=L.marker(latlng);
    image.bindPopup(popuptext);
    return image;
}

function askForCoverage() {
    var data='bbox=' + map.getBounds().toBBoxString();
    document.getElementById('wait').style.display = 'block';
    $.ajax({
        url: 'ajaxcoverage.php',
        dataType: 'json',
        data: data,
        success: showCoverage
    });
}

function askForImages() {
    if (map.getZoom() < 10) { return }
    
    var data='bbox=' + map.getBounds().toBBoxString();
    $.ajax({
        url: 'ajaximages.php',
        dataType: 'json',
        data: data,
        success: showImages
    });
}

function showCoverage(ajaxresponse) {
    //layerCoverage.clearLayers(); //falla
    layerCoverage.setData(ajaxresponse);
    document.getElementById('wait').style.display = 'none';
}

function showImages(ajaxresponse) {
    layerImages.addData(ajaxresponse);
}
