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
    var image_url;
    var thumb_url;
    
    image_url = 'https://commons.wikimedia.org/wiki/File:'+feature.properties.image;
    thumb_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + feature.properties.md5.substring(0,1) + '/' + feature.properties.md5.substring(0,2) + '/' + feature.properties.image + '/150px-' + feature.properties.image;
    popuptext = '<table border=0 width=300px style="text-align: left;">';
    popuptext = popuptext + '<tr><td colspan=2><b><a href="'+image_url+'" target="_blank">'+feature.properties.image.replace(/_/g,' ')+'</a></b></td></tr>';
    popuptext = popuptext + '<tr><td><a href="'+image_url+'" target="_blank"><img src="'+thumb_url+'" /></a></td>';
    popuptext = popuptext + '<td valign=top><b>Coordinates:</b><br/>'+latlng.lat+', '+latlng.lng;
    popuptext = popuptext + '<br/><b>Author:</b><br/>__AUTHOR__';
    popuptext = popuptext + '<br/><b>Date:</b><br/>__DATE__';
    popuptext = popuptext + '</td></tr>';
    popuptext = popuptext + '<tr><td colspan=2><b>Description:</b><br/>__DESCRIPTION__</td></tr>';
    popuptext = popuptext + '</table>';
    image=L.marker(latlng).on('click', function () {
            var wikiraw;
            wikiraw = '';
            $.ajax({
                url: 'ajaxwikiraw.php',
                dataType: 'text',
                data: 'file='+feature.properties.image,
                success: function(result) {
                    var author = result.match(/author *= *([^\n]*)/i);
                    if (author.length == 2) { author = author[1]; } else { author = ''; }
                    popuptext = popuptext.replace('__AUTHOR__', author);
                    var date = result.match(/date *= *([^\n]*)/i);
                    if (date.length == 2) { date = date[1]; } else { date = ''; }
                    popuptext = popuptext.replace('__DATE__', date);
                    var description = result.match(/description *= *([^\n]*)/i);
                    if (description.length == 2) { description = description[1]; } else { description = ''; }
                    popuptext = popuptext.replace('__DESCRIPTION__', description);
                    image.setPopupContent(popuptext);
                }
            });
            var author;
            
            
            //popuptext = popuptext.replace('__DATE__', '___DATE___');
            
        });
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
    layerImages.clearLayers();
    layerImages.addData(ajaxresponse);
}
