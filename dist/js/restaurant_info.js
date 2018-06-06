'use strict';

var restaurant = void 0;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
  fetchRestaurantFromURL(function (error, restaurant) {
    if (error) {
      // Got an error!
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
};

/**
 * Get current restaurant from page URL.
 */
window.fetchRestaurantFromURL = function (callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  var id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    var error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
window.fillRestaurantHTML = function () {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  var address = document.getElementById('restaurant-address');
  var index = restaurant.address.indexOf(',') + 1;
  var formattedAddress = [restaurant.address.slice(0, index), '<br>', restaurant.address.slice(index)].join('');
  address.innerHTML = formattedAddress;

  var image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  var imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  var imageFileName = imageUrl.substring(4);
  image.src = imageUrl;
  image.alt = '' + restaurant.name;
  // fetch smaller image files on smaller, 1x screens
  image.srcset = 'img/sizes/sm-' + imageFileName + '.jpg 360w,\n                  img/sizes/md-' + imageFileName + '.jpg 480w,\n                  img/sizes/lg-' + imageFileName + '.jpg 800w,\n                  img/sizes/lg-' + imageFileName + '.jpg 2x';

  var cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
window.fillRestaurantHoursHTML = function () {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

  var hours = document.getElementById('restaurant-hours');
  for (var key in operatingHours) {
    var row = document.createElement('tr');

    var day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute("valign", "top");
    row.appendChild(day);

    var time = document.createElement('td');
    var _hours = operatingHours[key];
    var index = _hours.indexOf(',') + 1;
    if (index > 0) {
      var formattedTime = [_hours.slice(0, index), '<br>', _hours.slice(index)].join('');
      time.innerHTML = formattedTime;
    } else {
      time.innerHTML = operatingHours[key];
    }
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
window.fillReviewsHTML = function () {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.reviews;

  var container = document.getElementById('reviews-container');
  var title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  var ul = document.getElementById('reviews-list');
  reviews.forEach(function (review) {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
window.createReviewHTML = function (review) {
  var li = document.createElement('li');

  var cardHeader = document.createElement('div');
  cardHeader.className = 'review-card-header';
  var cardBody = document.createElement('div');
  cardBody.className = 'review-card-body';

  var name = document.createElement('p');
  name.innerHTML = review.name;
  cardHeader.appendChild(name);

  var date = document.createElement('time');
  date.innerHTML = review.date;
  cardHeader.appendChild(date);

  li.appendChild(cardHeader);

  var rating = document.createElement('p');
  rating.innerHTML = 'Rating: ' + review.rating;
  cardBody.appendChild(rating);

  var comments = document.createElement('article');
  comments.innerHTML = review.comments;
  cardBody.appendChild(comments);

  li.appendChild(cardBody);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
window.fillBreadcrumb = function () {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.lastElementChild.removeAttribute('aria-current');
  var li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
window.getParameterByName = function (name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};