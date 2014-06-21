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
var featuredicon;
var qualityicon;
var normalicon;

// when the whole document has loaded call the init function
$(document).ready(init);

function init() {
    // map stuff
    // base layer
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';    
    var osmAttrib='Map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors | <a href="https://commons.wikimedia.org/" target="_blank">Images database</a> by Commons editors | <a href="https://github.com/emijrp/commons-coverage" target="_blank">Source code</a> in GitHub';
    
    // markericons
    featuredicon=L.icon({
        iconUrl: 'leaflet/images/featuredicon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 20],
        popupAnchor: [0, -20]
    });
    qualityicon=L.icon({
        iconUrl: 'leaflet/images/qualityicon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 20],
        popupAnchor: [0, -20]
    });
    normalicon=L.icon({
        iconUrl: 'leaflet/images/normalicon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 20],
        popupAnchor: [0, -20]
    });
    
    // layers
    layerOSM = new L.TileLayer(osmUrl, {
        minZoom: 2, 
        maxZoom: 19, 
        attribution: osmAttrib,
    });

    layerCoverage = new L.TileLayer.MaskCanvas({opacity: 0.5, radius: 500, useAbsoluteRadius: true});
    
    layerImages = L.geoJson(null, {
        pointToLayer: setImageMarker,
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

function setImageMarker(feature,latlng) {
    var icon;
    var title;
    var image;
    var popuptext;
    var image_url;
    var thumb_url;
    var zIndex;
    
    image_url = 'https://commons.wikimedia.org/wiki/File:'+feature.properties.image;
    thumb_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + feature.properties.md5.substring(0,1) + '/' + feature.properties.md5.substring(0,2) + '/' + feature.properties.image + '/150px-' + feature.properties.image;
    popuptext = '<table border=0 width=300px style="text-align: left;">';
    popuptext = popuptext + '<tr><td colspan=2><b><a href="'+image_url+'" target="_blank">'+feature.properties.image.replace(/_/g,' ')+'</a></b></td></tr>';
    popuptext = popuptext + '<tr><td valign=top><b>Coordinates:</b><br/>'+latlng.lat+', '+latlng.lng;
    popuptext = popuptext + '<br/><b>Author:</b><br/>__AUTHOR__';
    popuptext = popuptext + '<br/><b>Date:</b><br/>__DATE__</td>';
    popuptext = popuptext + '<td><a href="'+image_url+'" target="_blank"><img src="'+thumb_url+'" /></a></td></tr>';
    popuptext = popuptext + '<tr><td colspan=2><b>Description:</b><br/>__DESCRIPTION__</td></tr>';
    popuptext = popuptext + '</table>';
    
    if (feature.properties.featured == '1') {
        icon = featuredicon;
        title = '"'+feature.properties.image.replace(/_/g,' ')+'" is a featured picture';
        zIndex = 1100;
    } else if (feature.properties.quality == '1') {
        icon = qualityicon;
        title = '"'+feature.properties.image.replace(/_/g,' ')+'" is a quality picture';
        zIndex = 1050;
    } else {
        icon = normalicon;
        title = '"'+feature.properties.image.replace(/_/g,' ')+'"';
    }
    
    image=L.marker(latlng, {icon: icon, title: title, zIndexOffset: zIndex}).on('click', function () {
            var wikiraw;
            wikiraw = '';
            $.ajax({
                url: 'ajaxwikiraw.php',
                dataType: 'text',
                data: 'file='+feature.properties.image,
                success: function(result) {
                    var author = result.match(/\|\s*author\s*=([^\n\r]*)/i);
                    if (author.length == 2 && $.trim(author[1])) { author = $.trim(author[1]); } else { author = 'n/d'; }
                    popuptext = popuptext.replace('__AUTHOR__', wiki2html(author));
                    
                    var date = result.match(/\|\s*date\s*=([^\n\r]*)/i);
                    if (date.length == 2 && $.trim(date[1])) { date = $.trim(date[1]); } else { date = 'n/d'; }
                    popuptext = popuptext.replace('__DATE__', date);
                    
                    var description = result.match(/\|\s*description\s*=([^\n\r]*)/i);
                    if (description.length == 2 && $.trim(description[1])) { description = $.trim(description[1]); } else { description = 'n/d'; }
                    popuptext = popuptext.replace('__DESCRIPTION__', wiki2html(description));
                    
                    image.setPopupContent(popuptext);
                }
            });
        });
    image.bindPopup(popuptext, {minWidth: 300});
    return image;
}

function wiki2html (wiki) {
    var html;
    html = wiki;
    
    //first [[link|links]]
    html = html.replace(/\[\[([^\[\]]+)\|([^\[\]]+)\]\]/ig, '<a href="https://commons.wikimedia.org/wiki/$1" target="_blank">$2<\/a>');
    html = html.replace(/\[\[([^\[\]]+)\]\]/ig, '<a href="https://commons.wikimedia.org/wiki/$1" target="_blank">$1<\/a>');
    //later [http:// links]
    html = html.replace(/\[([^\[\] ]+) ([^\[\]]+)\]/ig, '<a href="$1" target="_blank">$2<\/a>');
    
    //bold
    html = html.replace(/'''([^']+)'''/ig, '<b>$1</b>');
    //italic
    html = html.replace(/''([^']+)''/ig, '<i>$1</i>');
    
    //remove {{lang|1=}} templates
    html = html.replace(/\{\{\s*[a-z-]{2,5}\s*\|\s*1?\s*=?\s*([^\{\}]+?)\s*\}\}/ig, '$1');
    
    return html;
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
