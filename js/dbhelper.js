/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // database server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Review Database URL
   */
  static get REVIEW_DB_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const fetchHeaders = new Headers();
    fetchHeaders.append('content-type', 'application/json');
    fetch(DBHelper.DATABASE_URL, {header: fetchHeaders})
      .then(res => {
        res.json()
          .then(restaurants => {
            callback(null, restaurants);
          })
          .catch(err => console.log('Parse failed', err));
      })
      .catch(err => console.log('Failed to fetch from database', err));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let restaurant;
        restaurant = (Array.isArray(restaurants)) ? restaurants.find(r => r.id == id): restaurants;
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const identifier = (restaurant.photograph) ? restaurant.photograph: restaurant.id;
    return `img/${identifier}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Get ALL reviews
   */
  static getReviews(callback) {
    const fetchHeaders = new Headers();
    fetchHeaders.append('content-type', 'application/json');
    fetch(DBHelper.REVIEW_DB_URL, {header: fetchHeaders})
      .then(res => {
        res.json()
          .then(reviews => {
            callback(null, reviews);
          })
          .catch(err => {
            console.log('An error occurred when getting reviews', err);
          });
      })
      .catch(err => {
        console.log('Failed to fetch all reviews', err);
      });
  }

  /**
   * Get all reviews by restaurant id
   */
  static getReviewsByRestaurantId(id, callback) {
    DBHelper.getReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const _reviews = (Array.isArray(reviews)) ? reviews.filter(review => review.restaurant_id == id): reviews;
        if (_reviews) {
          callback(null, _reviews);
        } else {
          callback('Reviews do not exist', null);
        }
      }
    });
  }

  /**
   * Get review by its id
   */
  static getReviewById(id, callback) {
    DBHelper.getReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = (Array.isArray(reviews)) ? reviews.find(review => review.id == id): review;
        if (review) {
          callback(null, review);
        } else {
          callback('Review does not exist', null);
        }
      }
    });
  }

  /**
   * Perform POST request to add a review
   */
  static addNewReview(review) {
    const fetchHeaders = new Headers();
    fetchHeaders.append('content-type', 'application/json');
    return fetch(DBHelper.REVIEW_DB_URL, {
      method: 'POST',
      header: fetchHeaders,
      body: JSON.stringify(review)
    })
    .then(res => {
      if (res.status == 200) {
        return res.json()
          .then(data => {
            return data;
          })
          .catch(err => console.log('An error occurred parsing POST response', err));
        } else {
          console.log('POST request failed', res.status, res.statusText);
        }
    })
    .catch(err => console.log('An error occurred during POST request', err));
  }

  /**
   * Perform PUT request to update a review
   */
  static updateReview(id, review) {
    const fetchHeaders = new Headers();
    fetchHeaders.append('content-type', 'application/json');
    return fetch(`${DBHelper.REVIEW_DB_URL}/${id}`, {
      method: 'PUT',
      header: fetchHeaders,
      body: JSON.stringify(review)
    })
    .then(res => {
      if (res.status == 200) {
        return res.json()
          .then(data => {
            return data;
          })
          .catch(err => console.log('An error occurred parsing PUT response', err));
      }
    })
    .catch(err => console.log('An error occurred during PUT request', err));
  }

  static deleteReview(id) {
    return fetch(`${DBHelper.REVIEW_DB_URL}/${id}`, {
      method: 'DELETE',
    })
    .then(res => {
      console.log(res);
      if (res.status == 200) {
        return true;
      }
    })
    .catch(err => console.log('An error occurred during DELETE request', err));
  }

  /**
   * Get favorited restaurants
   */

}
