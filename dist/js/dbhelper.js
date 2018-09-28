"use strict";var _createClass=function(){function r(e,n){for(var t=0;t<n.length;t++){var r=n[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,n,t){return n&&r(e.prototype,n),t&&r(e,t),e}}();function _classCallCheck(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}var DBHelper=function(){function i(){_classCallCheck(this,i)}return _createClass(i,null,[{key:"fetchRestaurants",value:function(n){var e=new Headers;e.append("content-type","application/json"),fetch(i.RESTAURANT_DB_URL,{header:e}).then(function(e){e.json().then(function(e){n(null,e)}).catch(function(e){return console.log("Parse failed",e)})}).catch(function(e){return console.log("Failed to fetch from database",e)})}},{key:"fetchRestaurantById",value:function(r,o){i.fetchRestaurants(function(e,n){if(e)o(e,null);else{var t;(t=Array.isArray(n)?n.find(function(e){return e.id==r}):n)?o(null,t):o("Restaurant does not exist",null)}})}},{key:"fetchRestaurantByCuisine",value:function(r,o){i.fetchRestaurants(function(e,n){if(e)o(e,null);else{var t=n.filter(function(e){return e.cuisine_type==r});o(null,t)}})}},{key:"fetchRestaurantByNeighborhood",value:function(r,o){i.fetchRestaurants(function(e,n){if(e)o(e,null);else{var t=n.filter(function(e){return e.neighborhood==r});o(null,t)}})}},{key:"fetchRestaurantByCuisineAndNeighborhood",value:function(r,o,u){i.fetchRestaurants(function(e,n){if(e)u(e,null);else{var t=n;"all"!=r&&(t=t.filter(function(e){return e.cuisine_type==r})),"all"!=o&&(t=t.filter(function(e){return e.neighborhood==o})),u(null,t)}})}},{key:"fetchNeighborhoods",value:function(o){i.fetchRestaurants(function(e,t){if(e)o(e,null);else{var r=t.map(function(e,n){return t[n].neighborhood}),n=r.filter(function(e,n){return r.indexOf(e)==n});o(null,n)}})}},{key:"fetchCuisines",value:function(o){i.fetchRestaurants(function(e,t){if(e)o(e,null);else{var r=t.map(function(e,n){return t[n].cuisine_type}),n=r.filter(function(e,n){return r.indexOf(e)==n});o(null,n)}})}},{key:"urlForRestaurant",value:function(e){return"./restaurant.html?id="+e.id}},{key:"imageUrlForRestaurant",value:function(e){return"img/"+(e.photograph?e.photograph:e.id)}},{key:"mapMarkerForRestaurant",value:function(e,n){return new google.maps.Marker({position:e.latlng,title:e.name,url:i.urlForRestaurant(e),map:n,animation:google.maps.Animation.DROP})}},{key:"getReviews",value:function(n){var e=new Headers;e.append("content-type","application/json"),fetch(i.REVIEW_DB_URL,{header:e}).then(function(e){e.json().then(function(e){n(null,e)}).catch(function(e){console.log("An error occurred when getting reviews",e)})}).catch(function(e){console.log("Failed to fetch all reviews",e)})}},{key:"getReviewsByRestaurantId",value:function(r,o){i.getReviews(function(e,n){if(e)o(e,null);else{var t=Array.isArray(n)?n.filter(function(e){return e.restaurant_id==r}):n;t?o(null,t):o("Reviews do not exist",null)}})}},{key:"getReviewById",value:function(r,o){i.getReviews(function(e,n){if(e)o(e,null);else{var t=Array.isArray(n)?n.find(function(e){return e.id==r}):t;t?o(null,t):o("Review does not exist",null)}})}},{key:"addNewReview",value:function(e){var n=new Headers;return n.append("content-type","application/json"),fetch(i.REVIEW_DB_URL,{method:"POST",header:n,body:JSON.stringify(e)}).then(function(e){if(200<=e.status<=201)return e.json().then(function(e){return e}).catch(function(e){return console.log("An error occurred parsing review POST response",e)});console.log("POST request failed",e.status,e.statusText)}).catch(function(e){return console.log("An error occurred during review POST request",e)})}},{key:"updateReview",value:function(e,n){var t=new Headers;return t.append("content-type","application/json"),fetch(i.REVIEW_DB_URL+"/"+e,{method:"PUT",header:t,body:JSON.stringify(n)}).then(function(e){if(200==e.status)return e.json().then(function(e){return e}).catch(function(e){return console.log("An error occurred parsing review PUT response",e)})}).catch(function(e){return console.log("An error occurred during review PUT request",e)})}},{key:"deleteReview",value:function(e){return fetch(i.REVIEW_DB_URL+"/"+e,{method:"DELETE"}).then(function(e){return 200==e.status}).catch(function(e){return console.log("An error occurred during review DELETE request",e)})}},{key:"updateFavorites",value:function(e,n){var t=new Headers;t.append("content-type","application/json"),fetch(i.RESTAURANT_DB_URL+"/"+e+"/?is_favorite="+n,{method:"PUT",header:t,body:JSON.stringify({})}).then(function(e){200==e.status?console.log("Favorites updated"):console.log("Network error while updating favorites")}).catch(function(e){return console.log("An error occurred during favorites PUT request",e)})}},{key:"RESTAURANT_DB_URL",get:function(){return"http://localhost:1337/restaurants"}},{key:"REVIEW_DB_URL",get:function(){return"http://localhost:1337/reviews"}}]),i}();