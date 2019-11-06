"use strict";
let map;
let bounds;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {});
    bounds = new google.maps.LatLngBounds();

    google.maps.event.addListenerOnce(map, 'idle', function (e) {
        mapLoadedCb();
    });
}

function mapLoadedCb() {
    Promise.all([
        fetch('input.json').then(r => r.json()),
        fetch('us_counties_boundaries.json').then(r => r.json())
    ]).then((responses) => {

        responses[0].data.forEach(retailer => {
            let geoJson = {
                type: "FeatureCollection",
                features: []
            };

            retailer.counties.forEach(c => {
                geoJson.features.push(responses[1].features.find(f => {
                    return f.properties.NAME === c.countyName && f.properties.STATE === c.stateName;
                }));
            });

            const data_layer = new google.maps.Data({ map: map });

            data_layer.addGeoJson(geoJson);

            data_layer.setStyle({
                fillColor: retailer.overlayColor,
                strokeColor: retailer.overlayColor,
                strokeWeight: 1,
            });

            data_layer.forEach(feature => {
                feature.getGeometry().forEachLatLng(latLng => bounds.extend(latLng));
            });

            retailer.pins.forEach(pin => {
                fetch(`https://maps.google.com/maps/api/geocode/json?address=${pin.state},${pin.city},${pin.address1},${pin.zipcode}&key=AIzaSyB3YFpw47sl6D8vQG1ctJhVpLWZ9Jp-NLk`)
                    .then(r => r.json())
                    .then(res => {
                        new google.maps.Marker({
                            position: new google.maps.LatLng(res.results[0].geometry.location),
                            map: map,
                            title: pin.name
                        });
                        bounds.extend(new google.maps.LatLng(res.results[0].geometry.location));
                        map.fitBounds(bounds);
                    });
            });

        });

        map.fitBounds(bounds);
    });
}
