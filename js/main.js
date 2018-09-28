let restaurants,
  neighborhoods,
  cuisines
var map
var markers = [];
let observer;
let loadCount = 0;


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

window.addEventListener('load', event => {
  // when page has finished loading, attempt to clear any queued records from idb
  if (window.navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
    .then(swRegistration => {
      if (swRegistration) {
        navigator.serviceWorker.controller.postMessage('attempt-pending-submission');
      }
    });
  }

  const images = document.querySelectorAll('.restaurant-img');
  const options = {
    rootMargin: '50px 0px',
    threshold: 0.01
  };

  // when image would come into view within options threshold,
  // stop observing image and load it
  const onIntersection = entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        loadImage(entry.target);
      }
    });
  };

  if (!('IntersectionObserver' in window)) {
    Array.from(images).forEach(image => loadImage(image));
  } else {
    observer = new IntersectionObserver(onIntersection, options);
    images.forEach(image => observer.observe(image));
  }
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
window.fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
window.fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood, i) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.id = `n${i + 1}`;
    option.setAttribute('role', 'option');
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
window.fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
window.fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine, i) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.id = `c${i + 1}`;
    option.setAttribute('role', 'option');
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  google.maps.event.addListenerOnce(self.map, 'idle', () => {
    console.log('map loaded');
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
window.updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cOption = cSelect[cIndex];
  const nOption = nSelect[nIndex];

  const cuisine = cOption.value;
  const neighborhood = nOption.value;

  // remove aria-selected from old cuisine selection and add it to the new selection
  const oldCOption = cSelect.querySelector('[aria-selected="true"]');
  oldCOption.removeAttribute('aria-selected');
  cOption.setAttribute('aria-selected', 'true');

  // remove aria-selected from old neighborhood selection and add it to the new selection
  const oldNOption = nSelect.querySelector('[aria-selected="true"]');
  oldNOption.removeAttribute('aria-selected');
  nOption.setAttribute('aria-selected', 'true');

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
window.resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
window.fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
window.createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  picture.className = 'restaurant-img';

  const source = document.createElement('source');
  source.setAttribute('data-src', imageUrl);
  picture.append(source);

  const image = document.createElement('img');
  image.alt = `${restaurant.name}`;
  image.setAttribute('data-src', imageUrl);
  picture.append(image);
  li.append(picture);

  // load first row of pictures (always visible on load) depending on screen size
  const windowWidth = window.innerWidth;
  if (windowWidth < 700 && loadCount < 1)
    loadImage(picture);
  else if (windowWidth > 700 && windowWidth < 1024 && loadCount < 2)
    loadImage(picture);
  else if (windowWidth > 1024 && loadCount < 3)
    loadImage(picture);
  loadCount++;

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const actionButtonsContainer = document.createElement('div');
  actionButtonsContainer.className = 'action-buttons';
  li.append(actionButtonsContainer);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', `view-details for the restaurant, ${restaurant.name}`);
  actionButtonsContainer.append(more)

  const favorite = document.createElement('button');
  favorite.innerHTML = '❤';
  favorite.className = 'favorite-btn';
  let ariaAction = 'Add';
  let ariaPrep = 'to';
  if (restaurant.is_favorite == 'true') {
    favorite.classList.add('faved');
    ariaAction = 'Remove';
    ariaPrep = 'from';
  }
  favorite.setAttribute('aria-label', `${ariaAction} ${restaurant.name} ${ariaPrep} favorites`);
  favorite.addEventListener('click', e => {
    e.preventDefault();
    e.target.classList.toggle('faved');
    const faved = e.target.classList.contains('faved');
    if (faved) {
      ariaAction = 'Remove';
      ariaPrep = 'from';
    } else {
      ariaAction = 'Add';
      ariaPrep = 'to';
    }
    favorite.setAttribute('aria-label', `${ariaAction} ${restaurant.name} ${ariaPrep} favorites`);
    DBHelper.updateFavorites(restaurant.id, faved);
  });
  actionButtonsContainer.append(favorite);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
window.addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

window.loadImage = image => {
  const imageUrl = image.firstElementChild.dataset.src;
  if (imageUrl) {
    const imageFileName = imageUrl.substring(4);

    // source attributes
    // fetch smaller webp files on smaller, 1x screens
    image.children[0].srcset = `img/sizes/sm-${imageFileName}.webp 360w,
                    img/sizes/md-${imageFileName}.webp 480w,
                    img/sizes/lg-${imageFileName}.webp 800w,
                    img/sizes/lg-${imageFileName}.webp 2x`;
    image.children[1].sizes = `(min-width: 700px) 50vw,
                   (min-width: 1024px) 33vw`;

    // img attributes
    image.children[1].src = imageUrl;
    // fetch smaller image files on smaller, 1x screens
    image.children[1].srcset = `img/sizes/sm-${imageFileName}.jpg 360w,
                    img/sizes/md-${imageFileName}.jpg 480w,
                    img/sizes/lg-${imageFileName}.jpg 800w,
                    img/sizes/lg-${imageFileName}.jpg 2x`;
    image.children[1].sizes = `(min-width: 700px) 50vw,
                   (min-width: 1024px) 33vw`;
  }
};
