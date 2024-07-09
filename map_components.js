import VectorSource from 'ol/source/Vector.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import { Fill, Stroke, Style } from 'ol/style.js';
import View from 'ol/View.js';

/* 
    swung_or_not - a map of ridings (keys) to their status/margin (values):
        {"KingstonandtheIslands": 7949,
        "KitchenerCentre": "swung",
        ...
          }
    swung - `swung` if: bool(max(lib/con) < max(others))
    not - `margin` = (max(lib/con) - max(others)), where: margin > 0
 */

import * as swung_or_not from '/data/swing_and_margin.json' assert { type: 'json' };

// views: Views are 2D views of the map and don't affect the map layers

const default_view = new View({
  center: [49.7713, 96.8165],
  zoom: 2,
});


// styles: Styles are applied to vector layers as Style objects or an options object

let stroke = new Stroke({
  color: 'black',
  width: 3,
})

// placeholder color theme for ridings that are swung
const style_swung = new Style({
  fill: new Fill({
    color: 'rgba(0, 255, 0, 0.6)',
  }),
  stroke: stroke,
});

// placeholder color theme for ridings not yet swung
const style_not_swung = new Style({
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.6)',
  }),
  stroke: stroke,
});

// style to use as used hovers over riding
const hover_style = new Style({
  fill: new Fill({
    color: 'rgba(0, 0, 150, 0.4)',
  }),
  stroke: new Stroke({
    color: 'white',
    width: 3,
  }),
});

/**vector and tile layer components: a Vector layer draws a new map delineated 
by the vectors of 2D lat/long coordinates */

const source = new VectorSource({
  format: new GeoJSON(),
  url: '../data/ridings.json',
});

const tilelayer = new TileLayer({
  source: new OSM(),
});


const vectorlayer = new VectorLayer({
  source: source,
  // feature = key:value object representing a riding 
  style: function (feature) {
    // Remove French translation, leave only alpha numeric values
    const status = swung_or_not[feature.get('FEDNAME').split("/")[0].replace(/\W/g, '')];
    // using placeholder styles
    return status == 'swung' ? style_swung : style_not_swung;
  }
});


export { source, tilelayer, vectorlayer };
export { hover_style };
export { default_view };
export { swung_or_not };