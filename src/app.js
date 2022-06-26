let elements = {
  navigator: null,
  mapDiv: null,
  map: null,
  locateBtn: null,
  listenBtn: null,
 
  marker: null,
  circle: null,

  listenTimerID: null,
  shouldListen: false,
};
let dataEvent = null
let markers = []
let state = {
  name: null,
  lat: null,
  lon: null,
};

// Click on Map
 async function onMapClick(e) {
  var message 
  const leafletCoords =  (e.latlng);
  //console.log(leafletCoords)

  elements.marker = await L.marker(leafletCoords)
    .addTo(elements.map)

  ons.notification.prompt('Enter Name of Location')
    .then(function(input) {
      message = input ? input : 'Entered nothing!';
      })
    .then(() => {
      state = {name: message, lat: leafletCoords.lat ,lon: leafletCoords.lng }
      saveState(message)
      markers.push({Marker: elements.marker, Key: message})
      console.log(markers)
    }) 
    //console.log(ArrayData) 
   await elements.marker.addEventListener('click',(e) => {
    dataEvent = {lat:e.latlng.lat, lng: e.latlng.lng}
    //console.log(e)
    L.popup()
        .setLatLng(leafletCoords)
        .setContent(message +  `<br/><button id="popupButton" type="button" onclick="remove()">Remove</button>`)
        .openOn(elements.map);     
   }) 
    
 }

 function remove()
    {
     try{
     
     var data = markers.forEach(item => {
       //console.log(item._latlng)
       if(item.Marker._latlng.lat == dataEvent.lat && item.Marker._latlng.lng == dataEvent.lng)
       {
        elements.map.removeLayer(item.Marker)
        elements.map.closePopup() 
        localforage.removeItem(item.Key)
       }
     })  
      
     }catch(error){
      console.log(error)
      }
    }


const clear = () => {
  try
  {
    markers.forEach(item => {
      elements.map.removeLayer(item.Marker)
      markers=[]
   })
   localforage.clear()

  }catch(e){
    console.log(e)
  }
}

// Locate yourself
 const locate = () => {
  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by your browser!');
  } else {
    navigator.geolocation.getCurrentPosition(onLocateSuccess, onLocateFailure);
  }
};
const onLocateSuccess = (position) => {
  const { coords } = position;

  console.log(coords.latitude, coords.longitude);
  const leafletCoords = { lon: coords.longitude, lat: coords.latitude };
  elements.map.setView(leafletCoords, 12);
};

const errors = {
  1: '[PERMISSION_DENIED] Permission was denied to access location services.',
  2: '[POSITION_UNAVAILABLE] The GPS was not able to determine a location',
  3: '[TIMEOUT] The GPS failed to determine a location within the timeout duration',
};
const onLocateFailure = (error) => {
  console.error('Could not access location services!');
  console.error('errors[error.code]', errors[error.code]);
  console.error('error.message', error.message);
};

// Save Data
const saveState = async (name) => {
  console.log('saving state:', state);

  try {
    await localforage.setItem(name, state);
  } catch (e) {
    return console.log('error', e);
  }
  
  console.log('success');
}

const loadState = async () => {
  console.log('loading state');
  
     await localforage.iterate(function(value, key, iterationNumber) {
        const leafletCoords = [value.lat,value.lon];

        elements.marker =  L.marker(leafletCoords)
          .addTo(elements.map)
        markers.push({Marker: elements.marker, Key: value.name})
        elements.marker.addEventListener('click',(e) => {
          dataEvent = {lat:e.latlng.lat, lng: e.latlng.lng}
          L.popup()
              .setLatLng(leafletCoords)
              .setContent(value.name +  `<br/><button type="button" onclick="remove()">Remove</button>`)
              .openOn(elements.map);
          }) 

      }).then(function() {
        console.log(markers)
        console.log('Iteration has completed');
      }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
        });
      }  
 

  
const initMap = () => {
  const map = L.map('map').setView({ lon: 0, lat: 0 }, 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  L.control.scale({ imperial: false, metric: true }).addTo(map);

  return map;
};

const setUpPage = (evt) => {
  console.log('start init', evt.target.id);
  if (evt.target.id === 'home') {
    elements = {
      navigator: document.querySelector('#navigator'),
      mapDiv: document.querySelector('#map'),
      map: initMap(),
      locateBtn: document.querySelector('#locateBtn'),
      clearBtn: document.querySelector('#clearBtn')
    };

    if(elements.map){
      elements.locateBtn.addEventListener('click', locate);
      elements.clearBtn.addEventListener('click', clear);
      elements.map.on('click',onMapClick)
      loadState()
    }  
  }
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    if (elements.listenTimerID) stopListening(elements.shouldListen);
  } else {
    if (!elements.listenTimerID && elements.shouldListen) listenInterval();
  }
}

document.addEventListener('init', setUpPage);
document.addEventListener('visibilitychange', handleVisibilityChange);