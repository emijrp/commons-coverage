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
    
    // set the starting location for the centre of the map
    var start = new L.LatLng(0, 0);    
    
    // create the map
    map = new L.Map('mapdiv', {        // use the div called mapdiv
        center: start,                // centre the map as above
        zoom: 2,                    // start up zoom level
        layers: [layerOSM]        // layers to add 
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
        "Coverage": layerCoverage
    };
    
    // add the layers to a layer control
    L.control.layers(baseLayers, overlays).addTo(map);
    
    // create the hash url on the browser address line
    var hash = new L.Hash(map);
    
    var osmGeocoder = new L.Control.OSMGeocoder();
    map.addControl(osmGeocoder);
    
    map.on('moveend', whenMapMoves);
    askForCoverage();
}

function whenMapMoves(e) {
    askForCoverage();
}

function setMarker(feature,latlng) {
    var monument; 
    monument=L.marker(latlng);
    return monument;
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

function showCoverage(ajaxresponse) {
    //layerCoverage.clearLayers(); //falla
    layerCoverage.setData(ajaxresponse);
    document.getElementById('wait').style.display = 'none';
}
