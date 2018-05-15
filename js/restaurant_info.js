let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  const index = restaurant.address.indexOf(',') + 1;
  const formattedAddress = [restaurant.address.slice(0, index), '<br>', restaurant.address.slice(index)].join('');
  address.innerHTML = formattedAddress;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  const imageFileName = imageUrl.substring(4);
  image.src = imageUrl;
  // fetch smaller image files on smaller, 1x screens
  image.srcset = `img/sizes/sm-${imageFileName} 360w,
                  img/sizes/md-${imageFileName} 480w,
                  img/sizes/lg-${imageFileName} 800w,
                  img/sizes/lg-${imageFileName} 2x`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute("valign", "top");
    row.appendChild(day);

    const time = document.createElement('td');
    const _hours = operatingHours[key];
    const index = _hours.indexOf(',') + 1;
    if (index > 0) {
      const formattedTime = [_hours.slice(0, index), '<br>', _hours.slice(index)].join('');
      time.innerHTML = formattedTime;
    } else {
      time.innerHTML = operatingHours[key];
    }
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const cardHeader = document.createElement('div');
  cardHeader.className = 'review-card-header';
  const cardBody = document.createElement('div');
  cardBody.className = 'review-card-body';

  const name = document.createElement('p');
  name.innerHTML = review.name;
  cardHeader.appendChild(name);

  const date = document.createElement('time');
  date.innerHTML = review.date;
  cardHeader.appendChild(date);

  li.appendChild(cardHeader);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  cardBody.appendChild(rating);

  const comments = document.createElement('article');
  comments.innerHTML = review.comments;
  cardBody.appendChild(comments);

  li.appendChild(cardBody);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.lastElementChild.removeAttribute('aria-current');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
