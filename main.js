
import Map from 'ol/Map.js';
import { Select } from 'ol/interaction'
import { pointerMove } from 'ol/events/condition.js';
import * as riding_indices from '/data/riding_indices.json' assert { type: 'json' };

import { tilelayer, swung_or_not, source, vectorlayer, hover_style, default_view } from '/map_components.js';

// declaration and instantiation


let active_feature; // used to track riding where the user's mouse hovers  
let color_code_style, active_feature_style; //
let riding_name;
let user_riding_idx; // used to retrieve riding based on index
let currentFeature; // used to track riding highlighted when user submits postal code form
var start_datetime_count; // used for highlighting a riding as the user hovers over it

// 

const submit_bttn = document.getElementById('button_id');

var select = new Select({
  condition: pointerMove,
  style: function (feature) {
    var elapsed = new Date().getTime() - start_datetime_count;
    var opacity = Math.min(0.3 + elapsed / 10000, 0.8);
    feature.setStyle(hover_style);
    hover_style.getFill().setColor('rgba(0,0,255,' + opacity + ')');
    feature.changed();
    color_code_style = feature.getStyle()
    return color_code_style;
  }
});

// function definitions

function get_riding_index(postal_code) {


  let riding_data;
  const request = new XMLHttpRequest();
  // Open North's rate limit: 60 get requests per minute
  request.open("GET",
    "https://represent.opennorth.ca/postcodes/" + postal_code + "/",
    false // using false here to syncronous behaviour; for some reason the OSM breaks down in async 
  );
  request.send(null);

  if (request.status === 200) {
    riding_data = JSON.parse(request.responseText);
  }
  for (var boundary of riding_data["boundaries_centroid"]) {
    if ("Federal electoral district" == boundary["boundary_set_name"] &&
      boundary["url"].includes("/federal-electoral-districts/")
    ) {
      riding_name = boundary["name"];
      break;
    }

  }


  /* 1. Riding index is retrieved based on a hash map loaded from 
        riding_indices.json to avoid iterating through 338 records 
        in ridings.json to find the appropriate riding.
    2. I couldn't comprehend JS' unicode workings; did away with latin-1 
        unicode characters. the REGEX below removes all non-A-Za-z0-9 
        this ensures Open North riding name matches the keys in
        ridings_indeces  */

  user_riding_idx = riding_indices[riding_name.replace(/\W/g, '')];
}



const displayFeatureInfo = function (pixel, target) {
  const feature = target.closest('.ol-control')
    ? undefined
    : map.forEachFeatureAtPixel(pixel, function (feature) {
      return feature;
    });
  if (feature) {
    info.style.left = pixel[0] + 'px';
    info.style.top = pixel[1] + 'px';
    if (feature !== currentFeature) {
      info.style.visibility = 'visible';
      let riding = feature.get('FEDENAME');
      let text_to_display = riding + "\n" + (swung_or_not[riding.split("/")[0].replace(/\W/g, '')] == "swung" ? "Swung" : "Needs " + swung_or_not[riding.replace(/\W/g, '')] + " pledges to swing.");
      info.innerText = text_to_display;

    }
  } else {
    info.style.visibility = 'hidden';
  }
  currentFeature = feature;
};


// event handlers and map object (and method) initializationx`


const map = new Map({
  layers: [tilelayer, vectorlayer],
  target: 'map',
  view: default_view
});

// used to highlight riding as user hovers
map.on('pointermove', function (evt) {
  if (evt.dragging) {
    info.style.visibility = 'hidden';
    currentFeature = undefined;
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);

  displayFeatureInfo(pixel, evt.originalEvent.target);
});
map.getTargetElement().addEventListener('pointerleave', function () {
  currentFeature = undefined;
  info.style.visibility = 'hidden';
});
select.on('select', function () { start_datetime_count = new Date().getTime(); });
map.addInteraction(select);

/* placeholder for the actual pop up that will show 
    when a user click on a riding */

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel, evt.originalEvent.target);
});


// event handler for postal code form submission
submit_bttn.addEventListener(
  'click',
  function () {
    var formData = new FormData(document.getElementById("form_id"));
    var postal_code = formData.entries().next().value[1].toUpperCase().replace(' ', '');

    get_riding_index(postal_code);

    /** unhighlights currently highlighted riding if a user searches up another postal code
    if no postal code search has occurred, a riding feature is not yet defined  */

    if (active_feature !== undefined) {

      active_feature.setStyle(active_feature_style);
      active_feature.changed();
    }

    active_feature = source.getFeatureById(user_riding_idx);
    active_feature_style = active_feature.getStyle()
    const points = active_feature.getGeometry();

    default_view.fit(
      points,
      {
        padding: [17, 5, 3, 15],
        minResolution: 100 // this can be tweaked for optimal performance
      }
    );
    active_feature.setStyle(hover_style);
    active_feature.changed();
  },
  false,
);