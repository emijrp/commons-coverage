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
var sidebar;

// when the whole document has loaded call the init function
$(document).ready(init);

function init() {
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';    
    var osmAttrib='Map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors | <a href="https://commons.wikimedia.org/" target="_blank">Images database</a> by Commons editors | <a href="https://github.com/emijrp/commons-coverage" target="_blank">Source code</a> by <a href="https://en.wikipedia.org/wiki/User:Emijrp" target="_blank">emijrp</a> in GitHub';
    
    // marker icons
    var LeafIcon = L.Icon.extend({
        options: {
            iconSize: [25, 41],
            iconAnchor: [12, 40],
            popupAnchor: [1, -30]
        }
    });
    featuredicon=new LeafIcon({iconUrl: 'leaflet/images/featuredicon.png'});
    qualityicon=new LeafIcon({iconUrl: 'leaflet/images/qualityicon.png'});
    normalicon=new LeafIcon({iconUrl: 'leaflet/images/normalicon.png'});

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
    
    // create the map
    map = new L.Map('mapdiv', {
        center: new L.LatLng(0, 0),
        zoom: 2,
        layers: [layerOSM,layerImages]
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
    
    // locations searcher
    var osmGeocoder = new L.Control.OSMGeocoder();
    map.addControl(osmGeocoder);
    var hash = new L.Hash(map);
    
    // sidebar
    sidebar = L.control.sidebar('sidebar', {
        position: 'left',
        autoPan: false,
    });
    map.addControl(sidebar);
    setTimeout(function () {
        sidebar.show();
    }, 500);
    sidebar.setContent('<h1>Commons Coverage</h1><b>Welcome!</b> ' + 
        'This project visualizes <a href="https://commons.wikimedia.org/wiki/Commons:Geocoding" target="_blank">geolocated</a> images in <a href="http://commons.wikimedia.org/" target="_blank">Wikimedia Commons</a>. Imagine a world in which every single free image is surrounded by other less than 1 km far away. Explore your region and discover places without pictures.' + 
        '<h2>Statistics</h2>' + 
        '<table class="wikitable">' + 
        '<tr><th>Featured</th><td id="stats-featured-images"></td>' + 
        '<th>Quality</th><td id="stats-quality-images"></td>' + 
        '<th>Total images</th><td id="stats-total-images"></td></tr>' + 
        '</table>' +
        '<h2>Geolocate an image</h2>' + 
        'Add coordinates to an image in Wikimedia Commons:' +
        '<ul><li>TODO</li></ul>' +
        '<h2>Move marker to new location</h2>' + 
        'Modify coordinates of an image dragging the marker:' + 
        '<ul><li>TODO</li></ul>' +
        '<h2>See also</h2>' + 
        '<ul><li><a href="https://en.wikipedia.org/wiki/User:Emijrp/All_human_knowledge">All human knowledge</a></li>' +
        '<li><a href="http://tools.wmflabs.org/wmcounter/">Wikimedia projects edit counter</a></li></ul>' +
        ''
        );
    
    map.on('moveend', whenMapMoves);
    askForCoverage();
    askForImageMarkers();
}

function whenMapMoves(e) {
    askForCoverage();
    askForImageMarkers();
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
    popuptext = '<table border=0 width=300px style="text-align: left;">' + 
                '<tr><td colspan=2><b><a href="'+image_url+'" target="_blank">'+feature.properties.image.replace(/_/g,' ')+'</a></b></td></tr>' + 
                '<tr><td valign=top><b>Coordinates:</b><br/>'+latlng.lat+', '+latlng.lng + 
                '<br/><b>Author:</b><br/>__AUTHOR__' + 
                '<br/><b>Date:</b><br/>__DATE__' + 
                '<br/><b>License:</b><br/>__LICENSE__</td>' + 
                '<td><a href="'+image_url+'" target="_blank"><img src="'+thumb_url+'" /></a></td></tr>' + 
                '<tr><td colspan=2><b>Description:</b><br/>__DESCRIPTION__<br/><b>Categories:</b> __CATEGORIES__</td></tr>' + 
                '</table>';
    
    if (feature.properties.f == '1') {
        icon = featuredicon;
        title = '"'+feature.properties.image.replace(/_/g,' ')+'" is a featured picture';
        zIndex = 1100;
    } else if (feature.properties.q == '1') {
        icon = qualityicon;
        title = '"'+feature.properties.image.replace(/_/g,' ')+'" is a quality picture';
        zIndex = 1050;
    } else {
        icon = normalicon;
        title = '"'+feature.properties.image.replace(/_/g,' ')+'"';
    }
    
    image=L.marker(latlng, {icon: icon, title: title, zIndexOffset: zIndex}).on('popupopen', function () {
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
                    
                    var categories = new Array();
                    var regexp = /\[\[\s*Category\s*:\s*([^\n\r\[\]\|]+)\s*[\|\]]/ig;
                    var match = regexp.exec(result);
                    while (match != null) {
                        categories.push('<a href="https://commons.wikimedia.org/wiki/Category:' + $.trim(match[1]) + '" target="_blank">' + $.trim(match[1]) + '</a>');
                        match = regexp.exec(result);
                    }
                    popuptext = popuptext.replace('__CATEGORIES__', categories.join(', '));
                    
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

function askForImageMarkers() {
    if (map.getZoom() < 10) { return }
    
    var data='bbox=' + map.getBounds().toBBoxString();
    $.ajax({
        url: 'ajaximages.php',
        dataType: 'json',
        data: data,
        success: showImageMarkers
    });
}

function showCoverage(ajaxresponse) {
    //layerCoverage.clearLayers(); //falla
    layerCoverage.setData(ajaxresponse);
    $('#stats-total-images').text(ajaxresponse.length);
    document.getElementById('wait').style.display = 'none';
}

function showImageMarkers(ajaxresponse) {
    var featured = 0;
    var quality = 0;
    
    layerImages.clearLayers();
    for (i=0; i<ajaxresponse['features'].length; i++) {
        if (ajaxresponse['features'][i]['properties']['f'] == '1') {
            featured += 1;
        } else if (ajaxresponse['features'][i]['properties']['q'] == '1') {
            quality += 1;
        }
    }
    $('#stats-featured-images').text(featured);
    $('#stats-quality-images').text(quality);
    layerImages.addData(ajaxresponse);
}
