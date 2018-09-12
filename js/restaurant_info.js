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
 * Get current restaurant and reviews from page URL.
 */
window.fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    let error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      DBHelper.getReviewsByRestaurantId(id, (reviewError, reviews) => {
        self.reviews = reviews;
        if (!reviews) {
          console.error(reviewError);
          return;
        }
        fillRestaurantHTML();
        callback(null, restaurant)
      });
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
window.fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  const index = restaurant.address.indexOf(',') + 1;
  const formattedAddress = [restaurant.address.slice(0, index), '<br>', restaurant.address.slice(index)].join('');
  address.innerHTML = formattedAddress;

  const picture = document.getElementById('restaurant-img');
  const source = document.getElementById('picture-source');
  const image = document.getElementById('picture-img');
  picture.className = 'restaurant-img';
  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  const imageFileName = imageUrl.substring(4);
  // fetch smaller image files on smaller, 1x screens
  source.srcset = `img/sizes/sm-${imageFileName}.webp 360w,
                  img/sizes/md-${imageFileName}.webp 480w,
                  img/sizes/lg-${imageFileName}.webp 800w,
                  img/sizes/lg-${imageFileName}.webp 2x`;
  image.alt = `${restaurant.name}`;
  // fetch smaller image files on smaller, 1x screens
  image.srcset = `img/sizes/sm-${imageFileName}.jpg 360w,
                  img/sizes/md-${imageFileName}.jpg 480w,
                  img/sizes/lg-${imageFileName}.jpg 800w,
                  img/sizes/lg-${imageFileName}.jpg 2x`;

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
window.fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
window.fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
  } else {
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  }

  createReviewForm();
}

/**
 * Create form to submit a review
 */

window.createReviewForm = () => {
  const container = document.getElementById('reviews-container');
  const reviewFormContainer = document.createElement('div');
  reviewFormContainer.className = 'review-form-container';

  const reviewForm = document.createElement('form');
  reviewForm.id = 'review-form';
  reviewForm.name = 'review-form';
  reviewForm.setAttribute('data-db-id', '-1');
  const title = document.createElement('h4');
  title.innerHTML = "Submit a Review";
  title.id = 'review-input-title';
  reviewFormContainer.appendChild(title);

  // review name label and input field
  const reviewerNameContainer = document.createElement('div');
  reviewerNameContainer.className = 'review-name-container';

  const reviewerNameLabel = document.createElement('label');
  reviewerNameLabel.for = 'reviewer-name';
  reviewerNameLabel.innerHTML = "Your name";
  reviewerNameContainer.appendChild(reviewerNameLabel);

  const reviewerNameInput = document.createElement('input');
  reviewerNameInput.type = 'text';
  reviewerNameInput.name = 'reviewer-name';
  reviewerNameInput.id = 'reviewer-name';
  reviewerNameInput.placeholder = 'Enter your name here';
  reviewerNameInput.addEventListener('change', e => {
    e.preventDefault();
    checkFormValidation();
  });
  reviewerNameContainer.appendChild(reviewerNameInput);

  // attach name container to form
  reviewForm.appendChild(reviewerNameContainer);

  // review rating label and slider
  const ratingSliderContainer = document.createElement('div');
  ratingSliderContainer.className = 'review-rating-slider-container';

  const ratingSliderLabel = document.createElement('label');
  ratingSliderLabel.for = 'rating-slider';
  // ratingSliderLabel.innerHTML = "Your rating: ✰ ✰ ✰ ✰ ✰";
  ratingSliderLabel.innerHTML = 'Your rating ';
  ratingSliderLabel.id = 'rating-slider-label';
  const starRating = document.createElement('span');
  starRating.innerHTML = '★★★★★';
  starRating.id = 'slider-value';
  ratingSliderLabel.appendChild(starRating);
  ratingSliderContainer.appendChild(ratingSliderLabel);

  const ratingSlider = document.createElement('input');
  ratingSlider.type = 'range';
  ratingSlider.min = 1;
  ratingSlider.max = 5;
  ratingSlider.value = 5;
  ratingSlider.step = 1;
  ratingSlider.name = 'rating';
  ratingSlider.id = 'rating';
  ratingSlider.addEventListener('change', e => {
    e.preventDefault();
    const ratingLabel = document.getElementById('slider-value');
    ratingLabel.innerHTML = "★".repeat(e.target.value);
  });
  ratingSliderContainer.appendChild(ratingSlider);

  reviewForm.appendChild(ratingSliderContainer);

  // review body label and text field
  const reviewTextContainer = document.createElement('div');
  reviewTextContainer.className = 'review-body-container';

  const reviewTextLabel = document.createElement('label');
  reviewTextLabel.innerHTML = 'Comments';
  reviewTextLabel.for = 'review-body';
  reviewTextContainer.appendChild(reviewTextLabel);

  const reviewTextInput = document.createElement('textarea');
  reviewTextInput.name = 'comments';
  reviewTextInput.id = 'review-body';
  reviewTextInput.placeholder = 'Enter your comments here';
  reviewTextInput.addEventListener('change', e => {
    e.preventDefault();
    checkFormValidation();
  });
  reviewTextContainer.appendChild(reviewTextInput);

  reviewForm.appendChild(reviewTextContainer);

  // form buttons container
  const formButtonsContainer = document.createElement('div');
  formButtonsContainer.className = 'review-buttons-container';

  // review deletion button, usually hidden
  const deleteReviewButton = document.createElement('button');
  deleteReviewButton.innerHTML = 'Remove';
  deleteReviewButton.id = 'review-delete-button';
  deleteReviewButton.addEventListener('click', e => {
    e.preventDefault();
    console.log('deleting review for', e.target);
  });
  formButtonsContainer.appendChild(deleteReviewButton);

  // form submission button
  const formSubmitButton = document.createElement('button');
  formSubmitButton.innerHTML = 'Submit';
  formSubmitButton.id = 'review-submit-button';
  formSubmitButton.disabled = true;
  formSubmitButton.addEventListener('click', e => {
    e.preventDefault();
    console.log('Submitting review');
    handleReviewSubmission();
  });
  formButtonsContainer.appendChild(formSubmitButton);

  reviewForm.appendChild(formButtonsContainer);

  reviewFormContainer.appendChild(reviewForm);
  container.appendChild(reviewFormContainer);
}

/**
 * Transfer information from posted review into review form
 * in order to make edits
 */
window.populateReviewForm = elem => {
  const title = document.getElementById('review-input-title');
  title.innerHTML = 'Edit your Review';
  const form = document.getElementById('review-form');
  const id = elem.getAttribute('data-db-id');
  const ps = elem.getElementsByTagName('p');
  const name = ps[0].innerHTML;
  const rawRating = ps[1].innerHTML;
  const rating = rawRating.match(/[★]/g).length;
  const comments = elem.getElementsByTagName('article')[0].innerHTML;
  form['reviewer-name'].value = name;
  form['rating'].value = rating;
  form['review-body'].value = comments;
  const ratingLabel = document.getElementById('slider-value');
  ratingLabel.innerHTML = '★'.repeat(rating);
  form.setAttribute('data-db-id', id);
  const submitButton = document.getElementById('review-submit-button');
  submitButton.innerHTML = 'Edit';
  const deleteButton = document.getElementById('review-delete-button');
  deleteButton.style.display = 'inline-block';
  checkFormValidation();
}

/**
 * Check if form is valid and enabled button if true
 */
window.checkFormValidation = () => {
  const form = document.getElementById('review-form');
  const name = form['reviewer-name'].value;
  const comments = form['review-body'].value;
  const formButton = document.getElementById('review-submit-button');
  formButton.disabled = (name && comments) ? false: true;
}

/**
 * Handle review form submission
 */
window.handleReviewSubmission = () => {
  const form = document.getElementById('review-form');
  const id = form.getAttribute('data-db-id');
  const name = form['reviewer-name'].value;
  const rating = parseInt(form['rating'].value);
  const comments = form['review-body'].value;
  const review = {
    "restaurant_id": self.restaurant.id,
    "name": name,
    "rating": rating,
    "comments": comments
  };
  // if an id greater than 0 was specified, a review is being updated
  if (id != -1) {
    const update = DBHelper.updateReview(id, review);
    update.then(_update => {
      if (_update) {
        console.log('Review successfully updated');
        updateReviewHTML(0, _update);
      } else {
        console.log('Error updating review');
      }
    })
  // otherwise a new review is being created
  } else {
    const newReview = DBHelper.addNewReview(review);
    newReview.then(_newReview => {
      if (_newReview) {
        console.log('Review successfully added', _newReview);
        self.reviews.push(_newReview);
        updateReviewHTML(1, _newReview);
      } else {
        console.log('Error creating new review');
      }
    });
  }
  resetReviewForm();
}

/**
 * Delete selected review from database
 */
window.removeReview = id => {

}

/**
 * Update listed reviews after add/remove
 */
window.updateReviewHTML = (amountChanged, review) => {
  const reviews = document.getElementById('reviews-list');
  switch (amountChanged) {
    case -1: // a review was deleted

      break;
    case 0: // review was updated, no change in amount
      console.log('Updating review list');
      for (let i=0; i < reviews.children.length; i++) {
        const child = reviews.children[i];
        if (child.getAttribute('data-db-id') == review.id) {
          const ps = child.getElementsByTagName('p');
          ps[0].innerHTML = review.name;
          ps[1].innerHTML = 'Rating: ' + '★'.repeat(review.rating);
          child.getElementsByTagName('article')[0].innerHTML = review.comments;
          child.getElementsByTagName('time')[0].innerHTML = getFormattedTimestamp(review.updatedAt);
          break;
        }
      }
      break;
    case 1: // a review was added
      console.log('Appending to review list');
      reviews.appendChild(createReviewHTML(review));
      break;
    default:
      break;
  }
}

/**
 * Clear form fields and change title
 */
window.resetReviewForm = () => {
  const title = document.getElementById('review-input-title');
  title.innerHTML = 'Submit a Review';
  const form = document.getElementById('review-form');
  form.reset();
}

/**
 * Create review HTML and add it to the webpage.
 */
window.createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('data-db-id', review.id);

  const cardHeader = document.createElement('div');
  cardHeader.className = 'review-card-header';
  const cardBody = document.createElement('div');
  cardBody.className = 'review-card-body';

  const name = document.createElement('p');
  name.innerHTML = review.name;
  cardHeader.appendChild(name);

  const date = document.createElement('time');
  date.innerHTML = getFormattedTimestamp(review.updatedAt);
  cardHeader.appendChild(date);

  li.appendChild(cardHeader);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${'★'.repeat(review.rating)}`;
  cardBody.appendChild(rating);

  const editButton = document.createElement('a');
  editButton.innerHTML = '✎';
  editButton.id = 'review-edit-button';
  editButton.href = '#review-form';
  editButton.addEventListener('click', e => {
    const elem = e.target.closest('li');
    populateReviewForm(elem);
  });
  cardBody.appendChild(editButton);

  const comments = document.createElement('article');
  comments.innerHTML = review.comments;
  cardBody.appendChild(comments);

  li.appendChild(cardBody);

  return li;
}

/**
 * Convert unix timestamp to a useable format
 */
window.getFormattedTimestamp = timestamp => {
  let _timestamp = new Date(timestamp);
  const day = _timestamp.getDate();
  const month = _timestamp.getMonth();
  const year = _timestamp.getFullYear();
  const monthStrings = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${monthStrings[month]} ${day}, ${year}`;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
window.fillBreadcrumb = (restaurant=self.restaurant) => {
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
window.getParameterByName = (name, url) => {
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
